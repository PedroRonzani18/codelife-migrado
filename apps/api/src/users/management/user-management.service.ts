import { BadRequestException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  adminUserSchema,
  adminUsersSchema,
  updateUserRoleInputSchema,
  type AdminUser,
  type UpdateUserRoleInput,
} from '@codelife/contracts/users';
import { USERS_PROVIDER_KEYS } from '../constants';
import type { UserRecord } from '../internal/user-record';
import type { IUsersRepository } from '../repository/users.repository.interface';

function toAdminUser(user: UserRecord): AdminUser {
  return adminUserSchema.parse({
    id: user.key,
    username: user.username,
    displayName: user.displayName,
    role: user.role,
  });
}

@Injectable()
export class UserManagementService {
  constructor(
    @Inject(USERS_PROVIDER_KEYS.USERS_REPOSITORY)
    private readonly repository: IUsersRepository,
  ) {}

  async list(): Promise<AdminUser[]> {
    return adminUsersSchema.parse((await this.repository.list()).map(toAdminUser));
  }

  async updateRole(actorId: string, userKey: string, input: UpdateUserRoleInput): Promise<AdminUser> {
    const parsed = updateUserRoleInputSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Payload inválido' });
    }

    const target = await this.repository.findByKey(userKey);
    if (!target) throw new NotFoundException('Usuário não encontrado');
    if (target.id === actorId && target.role === 'ADMIN' && parsed.data.role === 'USER') {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Um administrador não pode remover o próprio papel',
      });
    }

    const updated = await this.repository.updateRoleByKey(userKey, parsed.data.role);
    if (!updated) throw new NotFoundException('Usuário não encontrado');
    return toAdminUser(updated);
  }
}
