import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OBJECT_STORAGE, type ObjectStoragePort } from './object-storage.port';
import {
  MEDIA_REPOSITORY,
  type MediaRepositoryPort,
} from './media.repository.port';

export interface ControlledMediaFile {
  path: string;
  mimeType: string;
}

@Injectable()
export class MediaService {
  constructor(
    @Inject(MEDIA_REPOSITORY) private readonly repository: MediaRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
  ) {}

  async controlledFile(mediaAssetId: string): Promise<ControlledMediaFile> {
    const asset = await this.repository.mediaAssetById(mediaAssetId);
    if (!asset) throw new NotFoundException('Ativo de mídia não encontrado');

    return {
      path: await this.storage.resolveControlledObject(asset.objectKey, asset.mimeType),
      mimeType: asset.mimeType,
    };
  }
}
