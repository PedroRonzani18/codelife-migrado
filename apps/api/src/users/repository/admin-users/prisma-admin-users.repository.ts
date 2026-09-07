import { Injectable } from '@nestjs/common';
import { Prisma, UserRole as PrismaUserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { UserRole } from '@codelife/contracts/auth';
import type { IAdminUsersRepository, AdminUserRecord } from './admin-users.repository.interface';

const userSelect = {
  id: true,
  key: true,
  username: true,
  displayName: true,
  role: true,
} as const;

type PrismaUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class PrismaAdminUsersRepository implements IAdminUsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listUsers(): Promise<AdminUserRecord[]> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ username: 'asc' }, { key: 'asc' }],
      select: userSelect,
    });
    return users.map((user) => this.toUserRecord(user));
  }

  async findUserByKey(key: string): Promise<AdminUserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { key }, select: userSelect });
    return user ? this.toUserRecord(user) : null;
  }

  async updateUserRoleByKey(key: string, role: UserRole): Promise<AdminUserRecord | null> {
    try {
      const user = await this.prisma.user.update({
        where: { key },
        data: { role: this.toPrismaRole(role) },
        select: userSelect,
      });
      return this.toUserRecord(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') return null;
      throw error;
    }
  }

  private toPrismaRole(role: UserRole): PrismaUserRole {
    return role === 'ADMIN' ? PrismaUserRole.ADMIN : PrismaUserRole.USER;
  }

  private toUserRecord(user: PrismaUser): AdminUserRecord {
    return {
      id: user.id,
      key: user.key,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
