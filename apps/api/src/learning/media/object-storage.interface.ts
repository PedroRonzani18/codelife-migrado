export interface IObjectStorage {
  resolveControlledObject(objectKey: string, mimeType: string): Promise<string>;
  writeMediaObject(objectKey: string, buffer: Buffer): Promise<void>;
  deleteMediaObject(objectKey: string): Promise<void>;
}
