import { NotFoundException } from '@nestjs/common';
import type { IslandsRepositoryPort } from './islands.repository.port';
import { IslandsService } from './islands.service';

describe('IslandsService', () => {
  const repository: jest.Mocked<IslandsRepositoryPort> = { islandByKey: jest.fn() };
  const service = new IslandsService(repository);

  beforeEach(() => repository.islandByKey.mockReset());

  it('maps database records to the shared public contract', async () => {
    repository.islandByKey.mockResolvedValue({
      key: 'island-3',
      title: 'Interatividade',
      sortOrder: 0,
      levels: [{ key: 'island-3-l1', title: 'Variáveis', sortOrder: 0 }],
    });
    await expect(service.islandDetail('island-3')).resolves.toEqual({
      id: 'island-3',
      title: 'Interatividade',
      order: 0,
      levelCount: 1,
      levels: [{ id: 'island-3-l1', islandId: 'island-3', title: 'Variáveis', order: 0, availability: 'available' }],
    });
  });

  it('returns a domain-level not found error', async () => {
    repository.islandByKey.mockResolvedValue(null);
    await expect(service.islandDetail('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });
});
