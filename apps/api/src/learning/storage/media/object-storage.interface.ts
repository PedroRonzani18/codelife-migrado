export interface IObjectStorage {
  resolveControlledObject(objectKey: string, mimeType: string): Promise<string>;
}
