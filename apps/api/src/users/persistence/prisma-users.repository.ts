import { Inject, Injectable } from '@nestjs/common';
import { Prisma, UserRole as PrismaUserRole } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { UserRole } from '@codelife/contracts/users';
import { UniqueConstraintViolationError } from '@/prisma/errors/unique-constraint-violation.error';
import type { CreateUserInput, IUsersRepository, UserRecord } from './users.repository.interface';

const userSelect = {
  id: true,
  key: true,
  username: true,
  displayName: true,
  role: true,
} as const;

type PrismaUser = Prisma.UserGetPayload<{ select: typeof userSelect }>;

@Injectable()
export class PrismaUsersRepository implements IUsersRepository {
  constructor(@Inject(PrismaService) private readonly prisma: Pick<PrismaService, 'user'>) {}

  async findById(id: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: userSelect });
    return user ? this.toUserRecord(user) : null;
  }

  async findByKey(key: string): Promise<UserRecord | null> {
    const user = await this.prisma.user.findUnique({ where: { key }, select: userSelect });
    return user ? this.toUserRecord(user) : null;
  }

  async list(): Promise<UserRecord[]> {
    const users = await this.prisma.user.findMany({
      orderBy: [{ username: 'asc' }, { key: 'asc' }],
      select: userSelect,
    });
    return users.map((user) => this.toUserRecord(user));
  }

  async create(input: CreateUserInput): Promise<UserRecord> {
    try {
      const user = await this.prisma.user.create({
        data: {
          key: input.key,
          username: input.username,
          displayName: input.displayName,
        },
        select: userSelect,
      });
      return this.toUserRecord(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new UniqueConstraintViolationError();
      }
      throw error;
    }
  }

  async updateRoleByKey(key: string, role: UserRole): Promise<UserRecord | null> {
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

  private toUserRecord(user: PrismaUser): UserRecord {
    return {
      id: user.id,
      key: user.key,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
