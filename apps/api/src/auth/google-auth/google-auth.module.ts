import { Module } from '@nestjs/common';
import { GOOGLE_OIDC_PROTOCOL, googleOidcProtocol } from './google-auth.protocol';
import { GoogleAuthService } from './google-auth.service';

@Module({
  providers: [
    { provide: GOOGLE_OIDC_PROTOCOL, useValue: googleOidcProtocol },
    GoogleAuthService,
  ],
  exports: [GoogleAuthService],
})
export class GoogleAuthModule {}
