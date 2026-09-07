import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthUser, AuthUserRole } from '../repository/auth.repository.interface';

type RequestWithOptionalUser = Request & { user?: AuthUser };

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AuthUserRole[] | undefined>(ROLES_KEY, [
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
