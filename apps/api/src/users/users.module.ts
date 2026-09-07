import { Module } from '@nestjs/common';
import { AdminUsersController } from './admin/admin-users.controller';
import { USERS_PROVIDER_KEYS } from './constants';
import { PrismaUsersRepository } from './persistence/prisma-users.repository';
import { UserManagementService } from './management/user-management.service';

@Module({
  controllers: [AdminUsersController],
  providers: [
    { provide: USERS_PROVIDER_KEYS.USERS_REPOSITORY, useClass: PrismaUsersRepository },
    UserManagementService,
  ],
})
export class UsersModule {}
