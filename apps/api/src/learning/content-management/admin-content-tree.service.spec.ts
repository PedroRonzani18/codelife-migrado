import { AdminContentTreeService } from './admin-content-tree.service';
import type { IIslandsRepository } from '../islands/islands.repository.interface';

describe('AdminContentTreeService', () => {
  it('delegates tree retrieval to the islands repository', async () => {
    const mockIslandsRepo = {
      getAdminTree: jest.fn().mockResolvedValue([{ id: 'island-1', levels: [] }]),
    } as unknown as IIslandsRepository;

    const service = new AdminContentTreeService(mockIslandsRepo);
    const result = await service.getTree();

    expect(mockIslandsRepo.getAdminTree).toHaveBeenCalled();
    expect(result).toEqual([{ id: 'island-1', levels: [] }]);
  });
});
