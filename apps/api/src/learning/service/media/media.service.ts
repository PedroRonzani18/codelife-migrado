import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LEARNING_PROVIDER_KEYS } from '../../constants';
import type { IMediaRepository } from '../../repository/media/media.repository.interface';
import type { IObjectStorage } from '../../storage/media/object-storage.interface';
import type { IMediaService } from './media.service.interface';

export interface ControlledMediaFile {
  path: string;
  mimeType: string;
}

@Injectable()
export class MediaService implements IMediaService {
  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.MEDIA_REPOSITORY) private readonly repository: IMediaRepository,
    @Inject(LEARNING_PROVIDER_KEYS.OBJECT_STORAGE) private readonly storage: IObjectStorage,
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
