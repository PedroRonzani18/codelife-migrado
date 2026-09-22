import { NotFoundException } from '@nestjs/common';
import { fixtureIds } from '../../../prisma/seed';
import type { IMediaRepository } from './media.repository.interface';
import type { IObjectStorage } from './object-storage.interface';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let repository: jest.Mocked<IMediaRepository>;
  let storage: jest.Mocked<IObjectStorage>;
  let service: MediaService;

  beforeEach(() => {
    repository = {
      mediaAssetById: jest.fn().mockResolvedValue({
        id: fixtureIds.assets[0],
        objectKey: 'learning/island-3/variables.svg',
        mimeType: 'image/svg+xml',
      }),
      findById: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    };
    storage = {
      resolveControlledObject: jest.fn().mockResolvedValue('/controlled/variables.svg'),
      writeMediaObject: jest.fn(),
      deleteMediaObject: jest.fn(),
    };
    service = new MediaService(repository, storage);
  });

  it('resolves only the database-controlled object and declared MIME type', async () => {
    await expect(service.controlledFile(fixtureIds.assets[0])).resolves.toEqual({
      path: '/controlled/variables.svg',
      mimeType: 'image/svg+xml',
    });
    expect(storage.resolveControlledObject).toHaveBeenCalledWith(
      'learning/island-3/variables.svg',
      'image/svg+xml',
    );
  });

  it('does not resolve a missing media asset', async () => {
    repository.mediaAssetById.mockResolvedValue(null);
    await expect(service.controlledFile(fixtureIds.assets[0])).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.resolveControlledObject).not.toHaveBeenCalled();
  });
});
