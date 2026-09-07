import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaExternalIdentitiesRepository } from './prisma-external-identities.repository';
import { PrismaIdentityTransaction } from './prisma-identity-transaction';
import { PrismaUsersRepository } from '../../users/persistence/prisma-users.repository';

describe('PrismaIdentityTransaction', () => {
  it('runs the identity provisioning callback with repositories bound to one transaction client', async () => {
    const transaction = {
      user: {},
      externalIdentity: {},
    };
    const transactionRunner = jest.fn((operation: (client: typeof transaction) => Promise<unknown>) => operation(transaction));
    const prisma = { $transaction: transactionRunner } as unknown as PrismaService;
    const identityTransaction = new PrismaIdentityTransaction(prisma);

    await expect(identityTransaction.run(async ({ users, externalIdentities }) => {
      expect(users).toBeInstanceOf(PrismaUsersRepository);
      expect(externalIdentities).toBeInstanceOf(PrismaExternalIdentitiesRepository);
      return 'created';
    })).resolves.toBe('created');
    expect(transactionRunner).toHaveBeenCalledTimes(1);
  });
});
