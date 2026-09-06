export interface GoogleAuthorizationRequest {
  authorizationUrl: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface GoogleAuthCallbackInput {
  callbackUrl: string;
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface GoogleIdentity {
  subject: string;
  email?: string;
  emailVerified?: boolean;
  displayName?: string;
}
