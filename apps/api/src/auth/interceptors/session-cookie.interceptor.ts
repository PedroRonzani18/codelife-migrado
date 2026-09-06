import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Response } from 'express';
import { map, type Observable } from 'rxjs';
import { authSessionSchema } from '@codelife/contracts/auth';
import { clearSessionCookieOptions, sessionCookieOptions } from '../cookies/auth-cookie';
import type { AuthSession } from '../service/auth.service.interface';

@Injectable()
export class SetSessionCookieInterceptor implements NestInterceptor<AuthSession, ReturnType<typeof authSessionSchema.parse>> {
  constructor(private readonly config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler<AuthSession>): Observable<ReturnType<typeof authSessionSchema.parse>> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(map(({ token, user }) => {
      response.cookie(this.config.getOrThrow<string>('cookieName'), token, sessionCookieOptions(this.config));
      return authSessionSchema.parse({ user: { id: user.key, username: user.username, displayName: user.displayName } });
    }));
  }
}

@Injectable()
export class ClearSessionCookieInterceptor implements NestInterceptor<{ ok: true }, { ok: true }> {
  constructor(private readonly config: ConfigService) {}

  intercept(context: ExecutionContext, next: CallHandler<{ ok: true }>): Observable<{ ok: true }> {
    const response = context.switchToHttp().getResponse<Response>();
    return next.handle().pipe(map((body) => {
      response.clearCookie(this.config.getOrThrow<string>('cookieName'), clearSessionCookieOptions(this.config));
      return body;
    }));
  }
}
