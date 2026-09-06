import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  GoogleAuthCallbackInput,
  GoogleAuthorizationRequest,
  GoogleIdentity,
} from './google-auth.types';
import { GOOGLE_OIDC_PROTOCOL, type GoogleOidcProtocol } from './google-auth.protocol';

const GOOGLE_ISSUER = 'https://accounts.google.com';

@Injectable()
export class GoogleAuthService {
  private configuration?: ReturnType<GoogleOidcProtocol['discovery']>;

  constructor(
    private readonly config: ConfigService,
    @Inject(GOOGLE_OIDC_PROTOCOL) private readonly oidc: GoogleOidcProtocol,
  ) {}

  async createAuthorizationUrl(): Promise<GoogleAuthorizationRequest> {
    const codeVerifier = await this.oidc.randomPKCECodeVerifier();
    const codeChallenge = await this.oidc.calculatePKCECodeChallenge(codeVerifier);
    const state = await this.oidc.randomState();
    const nonce = await this.oidc.randomNonce();
    const configuration = await this.getConfiguration();

    const authorizationUrl = await this.oidc.buildAuthorizationUrl(configuration, {
      redirect_uri: this.requiredConfig('googleRedirectUri'),
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });

    return {
      authorizationUrl: authorizationUrl.toString(),
      state,
      nonce,
      codeVerifier,
    };
  }

  async handleCallback(input: GoogleAuthCallbackInput): Promise<GoogleIdentity> {
    if (!input.state || !input.nonce || !input.codeVerifier) {
      throw new Error('Google OIDC callback checks are incomplete');
    }

    let callbackUrl: URL;
    try {
      callbackUrl = new URL(input.callbackUrl);
    } catch {
      throw new Error('Google OIDC callback URL is invalid');
    }
    const configuredRedirectUri = new URL(this.requiredConfig('googleRedirectUri'));
    if (callbackUrl.origin !== configuredRedirectUri.origin || callbackUrl.pathname !== configuredRedirectUri.pathname) {
      throw new Error('Google OIDC callback URL does not match the configured redirect URI');
    }

    const tokens = await this.oidc.authorizationCodeGrant(
      await this.getConfiguration(),
      callbackUrl,
      {
        expectedState: input.state,
        expectedNonce: input.nonce,
        idTokenExpected: true,
        pkceCodeVerifier: input.codeVerifier,
      },
    );
    const claims = tokens.claims();
    if (!claims) throw new Error('Google OIDC response did not include an ID token');

    const subject = this.optionalString(claims.sub);
    if (!subject) throw new Error('Google OIDC response did not include a subject');

    const identity: GoogleIdentity = { subject };
    const email = this.optionalString(claims.email);
    const displayName = this.optionalString(claims.name);
    if (email) identity.email = email;
    if (displayName) identity.displayName = displayName;
    if (typeof claims.email_verified === 'boolean') identity.emailVerified = claims.email_verified;
    return identity;
  }

  private async getConfiguration(): Promise<Awaited<ReturnType<GoogleOidcProtocol['discovery']>>> {
    if (!this.configuration) {
      const clientSecret = this.config.get<string>('googleClientSecret');
      this.configuration = this.oidc.discovery(
        new URL(GOOGLE_ISSUER),
        this.requiredConfig('googleClientId'),
        clientSecret,
      );
    }
    return this.configuration;
  }

  private requiredConfig(key: 'googleClientId' | 'googleRedirectUri'): string {
    const value = this.config.get<string>(key);
    if (!value) throw new Error(`Google OIDC ${key} is not configured`);
    return value;
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }
}
