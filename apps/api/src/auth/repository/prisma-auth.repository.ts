import { Injectable } from '@nestjs/common';
import { IdentityProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuthIdentityProvider,
  IAuthRepository,
  NewUserWithExternalIdentity,
} from './auth.repository.interface';
import type { AuthUser } from '../types/auth-user';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error';

const authUserSelect = {
  id: true,
  key: true,
  username: true,
  displayName: true,
  role: true,
} as const;

type PrismaAuthUser = Prisma.UserGetPayload<{ select: typeof authUserSelect }>;

@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUserById(id: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { id }, select: authUserSelect });
    return user ? this.toAuthUser(user) : null;
  }

  async findUserByKey(key: string): Promise<AuthUser | null> {
    const user = await this.prisma.user.findUnique({ where: { key }, select: authUserSelect });
    return user ? this.toAuthUser(user) : null;
  }

  async findUserByExternalIdentity(provider: AuthIdentityProvider, subject: string) {
    const identity = await this.prisma.externalIdentity.findUnique({
      where: {
        provider_subject: {
          provider: this.toPrismaProvider(provider),
          subject,
        },
      },
      select: { user: { select: authUserSelect } },
    });
    return identity?.user ? this.toAuthUser(identity.user) : null;
  }

  async createUserWithExternalIdentity(input: NewUserWithExternalIdentity) {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            key: input.key,
            username: input.username,
            displayName: input.displayName,
          },
          select: authUserSelect,
        });
        await transaction.externalIdentity.create({
          data: {
            provider: this.toPrismaProvider(input.provider),
            subject: input.subject,
            email: input.email,
            emailVerified: input.emailVerified,
            userId: user.id,
          },
        });
        return this.toAuthUser(user);
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new UniqueConstraintViolationError();
      }
      throw error;
    }
  }

  private toPrismaProvider(provider: AuthIdentityProvider): IdentityProvider {
    if (provider === 'GOOGLE') return IdentityProvider.GOOGLE;
    throw new Error(`Unsupported authentication provider: ${provider}`);
  }

  private toAuthUser(user: PrismaAuthUser): AuthUser {
    return {
      id: user.id,
      key: user.key,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    };
  }
}
