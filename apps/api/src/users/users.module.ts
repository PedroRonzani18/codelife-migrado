import { Module } from '@nestjs/common';
import { AdminUsersController } from './controller/admin-users/admin-users.controller';
import { USERS_PROVIDER_KEYS } from './constants';
import { PrismaAdminUsersRepository } from './repository/admin-users/prisma-admin-users.repository';
import { AdminUsersService } from './service/admin-users/admin-users.service';

@Module({
  controllers: [AdminUsersController],
  providers: [
    { provide: USERS_PROVIDER_KEYS.ADMIN_USERS_REPOSITORY, useClass: PrismaAdminUsersRepository },
    { provide: USERS_PROVIDER_KEYS.ADMIN_USERS_SERVICE, useClass: AdminUsersService },
  ],
})
export class UsersModule {}
