export const MEDIA_REPOSITORY = Symbol('MEDIA_REPOSITORY');

export interface MediaAssetRecord {
  id: string;
  objectKey: string;
  mimeType: string;
}

export interface MediaRepositoryPort {
  mediaAssetById(mediaAssetId: string): Promise<MediaAssetRecord | null>;
}
