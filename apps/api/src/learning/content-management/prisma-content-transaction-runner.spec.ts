import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaContentTransactionRunner } from './prisma-content-transaction-runner';

describe('PrismaContentTransactionRunner', () => {
  it('executes operation inside a prisma transaction passing domain repositories', async () => {
    const txMock = {
      island: {},
      level: {},
      slide: {},
      mediaAsset: {},
      userIslandProgress: {},
      userLevelProgress: {},
    };
    const $transaction = jest.fn().mockImplementation(async (cb: (tx: unknown) => Promise<unknown>) => cb(txMock));
    const prismaService = { $transaction } as unknown as PrismaService;
    const runner = new PrismaContentTransactionRunner(prismaService);

    const operation = jest.fn().mockResolvedValue('success');
    const result = await runner.run(operation);

    expect(result).toBe('success');
    expect($transaction).toHaveBeenCalledTimes(1);
    expect(operation).toHaveBeenCalledWith(
      expect.objectContaining({
        islands: expect.anything(),
        levels: expect.anything(),
        slides: expect.anything(),
        media: expect.anything(),
        progress: expect.anything(),
      }),
    );
  });
});
