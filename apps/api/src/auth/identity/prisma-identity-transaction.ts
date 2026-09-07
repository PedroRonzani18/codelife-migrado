import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaExternalIdentitiesRepository } from './prisma-external-identities.repository';
import { PrismaUsersRepository } from '../../users/repository/prisma-users.repository';
import type { IdentityTransactionRepositories, IIdentityTransaction } from './identity-transaction.interface';

@Injectable()
export class PrismaIdentityTransaction implements IIdentityTransaction {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(operation: (repositories: IdentityTransactionRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (transaction) => operation({
      users: new PrismaUsersRepository(transaction),
      externalIdentities: new PrismaExternalIdentitiesRepository(transaction),
    }));
  }
}
