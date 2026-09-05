import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import type { Request } from 'express';

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class ExperimentalLoginThrottleGuard implements CanActivate {
  private readonly attempts = new Map<string, number[]>();

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.ip || request.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (this.attempts.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
    if (recent.length >= MAX_ATTEMPTS) {
      throw new HttpException('Muitas tentativas de login experimental', HttpStatus.TOO_MANY_REQUESTS);
    }
    recent.push(now);
    this.attempts.set(key, recent);
    return true;
  }
}
