import { Injectable } from '@nestjs/common';
import { IdentityProvider, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type {
  AuthIdentityProvider,
  IAuthRepository,
  NewUserWithExternalIdentity,
} from './auth.repository.interface';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error';

@Injectable()
export class PrismaAuthRepository implements IAuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findUserByKey(key: string) {
    return this.prisma.user.findUnique({ where: { key } });
  }

  async findUserByExternalIdentity(provider: AuthIdentityProvider, subject: string) {
    const identity = await this.prisma.externalIdentity.findUnique({
      where: {
        provider_subject: {
          provider: this.toPrismaProvider(provider),
          subject,
        },
      },
      include: { user: true },
    });
    return identity?.user ?? null;
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
        return user;
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
}
