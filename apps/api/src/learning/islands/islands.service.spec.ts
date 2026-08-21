import { NotFoundException } from '@nestjs/common';
import type { IslandsRepositoryPort } from './islands.repository.port';
import { IslandsService } from './islands.service';

describe('IslandsService', () => {
  const repository: jest.Mocked<IslandsRepositoryPort> = { islandBySlug: jest.fn() };
  const service = new IslandsService(repository);

  beforeEach(() => repository.islandBySlug.mockReset());

  it('maps database records to the shared public contract', async () => {
    repository.islandBySlug.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000401',
      slug: 'island-3',
      title: 'Interatividade',
      position: 1,
      levels: [{ id: '00000000-0000-4000-8000-000000000601', title: 'Variáveis', position: 1 }],
    });
    await expect(service.islandDetail('island-3')).resolves.toEqual({
      id: '00000000-0000-4000-8000-000000000401',
      slug: 'island-3',
      title: 'Interatividade',
      position: 1,
      levelCount: 1,
      levels: [{ id: '00000000-0000-4000-8000-000000000601', title: 'Variáveis', position: 1, availability: 'available' }],
    });
  });

  it('returns a domain-level not found error', async () => {
    repository.islandBySlug.mockResolvedValue(null);
    await expect(service.islandDetail('unknown')).rejects.toBeInstanceOf(NotFoundException);
  });
});
