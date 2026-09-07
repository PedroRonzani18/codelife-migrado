import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import type { UserRole } from '@codelife/contracts/users';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRecord } from '../../users/internal/user-record';

type RequestWithOptionalUser = Request & { user?: UserRecord };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles?.length) return true;

    const request = context.switchToHttp().getRequest<RequestWithOptionalUser>();
    if (!request.user) throw new UnauthorizedException('Sessão ausente');
    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('Papel insuficiente para acessar este recurso');
    }
    return true;
  }
}
