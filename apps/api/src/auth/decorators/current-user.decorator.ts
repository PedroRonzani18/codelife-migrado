import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest } from '../types/authenticated-request';

type CurrentUserField = keyof AuthenticatedRequest['user'];

export const CurrentUser = createParamDecorator(
  (field: CurrentUserField | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return field ? request.user[field] : request.user;
  },
);
