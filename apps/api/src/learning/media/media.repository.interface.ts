export interface MediaAssetRecord {
  id: string;
  objectKey: string;
  mimeType: string;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  checksum?: string | null;
}

export interface CreateMediaAssetInput {
  id?: string;
  objectKey: string;
  mimeType: string;
  sizeBytes?: number | null;
  width?: number | null;
  height?: number | null;
  checksum?: string | null;
}

export interface IMediaRepository {
  mediaAssetById(mediaAssetId: string): Promise<MediaAssetRecord | null>;
  findById(id: string): Promise<MediaAssetRecord | null>;
  create(input: CreateMediaAssetInput): Promise<MediaAssetRecord>;
  delete(id: string): Promise<void>;
}
