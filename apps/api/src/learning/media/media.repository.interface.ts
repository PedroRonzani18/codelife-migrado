export interface MediaAssetRecord {
  id: string;
  objectKey: string;
  mimeType: string;
}

export interface IMediaRepository {
  mediaAssetById(mediaAssetId: string): Promise<MediaAssetRecord | null>;
}
