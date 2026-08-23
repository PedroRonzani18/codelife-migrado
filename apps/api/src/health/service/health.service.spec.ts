import { ServiceUnavailableException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  const queryRaw = jest.fn();
  let health: HealthService;

  beforeEach(async () => {
    queryRaw.mockReset();
    const module = await Test.createTestingModule({
      providers: [
        HealthService,
        { provide: PrismaService, useValue: { $queryRaw: queryRaw } },
      ],
    }).compile();
    health = module.get(HealthService);
  });

  it('reports liveness without consulting the database', () => {
    expect(health.live()).toEqual({ status: 'ok' });
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it('reports readiness after a successful database probe', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(health.ready()).resolves.toEqual({ status: 'ready' });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('returns a safe 503 when the database probe fails', async () => {
    queryRaw.mockRejectedValue(new Error('postgresql://secret@internal-host/database'));

    const result = health.ready();
    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(result).rejects.not.toThrow('internal-host');
    await expect(result).rejects.toMatchObject({ status: 503 });
  });
});
