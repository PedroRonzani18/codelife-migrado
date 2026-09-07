import { Inject, Injectable } from '@nestjs/common';
import { IdentityProvider as PrismaIdentityProvider, Prisma } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import { UniqueConstraintViolationError } from '@/prisma/errors/unique-constraint-violation.error';
import type {
  CreateExternalIdentityInput,
  ExternalIdentityRecord,
  IdentityProvider,
  IExternalIdentitiesRepository,
} from './external-identities.repository.interface';

const externalIdentitySelect = {
  id: true,
  provider: true,
  subject: true,
  userId: true,
  email: true,
  emailVerified: true,
} as const;

type PrismaExternalIdentity = Prisma.ExternalIdentityGetPayload<{ select: typeof externalIdentitySelect }>;

@Injectable()
export class PrismaExternalIdentitiesRepository implements IExternalIdentitiesRepository {
  constructor(@Inject(PrismaService) private readonly prisma: Pick<PrismaService, 'externalIdentity'>) {}

  async findByProviderAndSubject(provider: IdentityProvider, subject: string): Promise<ExternalIdentityRecord | null> {
    const identity = await this.prisma.externalIdentity.findUnique({
      where: {
        provider_subject: {
          provider: this.toPrismaProvider(provider),
          subject,
        },
      },
      select: externalIdentitySelect,
    });
    return identity ? this.toExternalIdentityRecord(identity) : null;
  }

  async create(input: CreateExternalIdentityInput): Promise<ExternalIdentityRecord> {
    try {
      const identity = await this.prisma.externalIdentity.create({
        data: {
          provider: this.toPrismaProvider(input.provider),
          subject: input.subject,
          email: input.email,
          emailVerified: input.emailVerified,
          userId: input.userId,
        },
        select: externalIdentitySelect,
      });
      return this.toExternalIdentityRecord(identity);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new UniqueConstraintViolationError();
      }
      throw error;
    }
  }

  private toPrismaProvider(provider: IdentityProvider): PrismaIdentityProvider {
    if (provider === 'GOOGLE') return PrismaIdentityProvider.GOOGLE;
    throw new Error(`Unsupported authentication provider: ${provider}`);
  }

  private toExternalIdentityRecord(identity: PrismaExternalIdentity): ExternalIdentityRecord {
    return {
      id: identity.id,
      provider: this.toDomainProvider(identity.provider),
      subject: identity.subject,
      userId: identity.userId,
      email: identity.email,
      emailVerified: identity.emailVerified,
    };
  }

  private toDomainProvider(provider: PrismaIdentityProvider): IdentityProvider {
    if (provider === PrismaIdentityProvider.GOOGLE) return 'GOOGLE';
    throw new Error(`Unsupported authentication provider: ${provider}`);
  }
}
