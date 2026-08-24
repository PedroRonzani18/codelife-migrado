import type { ControlledMediaFile } from './media.service';

export interface IMediaService {
  controlledFile(mediaAssetId: string): Promise<ControlledMediaFile>;
}
