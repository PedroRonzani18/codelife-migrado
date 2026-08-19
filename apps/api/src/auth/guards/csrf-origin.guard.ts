import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

@Injectable()
export class CsrfOriginGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;

    const cookieName = this.config.getOrThrow<string>('cookieName');
    if (!request.cookies?.[cookieName]) return true;

    const origin = request.header('origin');
    if (origin !== this.config.getOrThrow<string>('webOrigin')) {
      throw new ForbiddenException('Origem da solicitação não autorizada');
    }
    return true;
  }
}
