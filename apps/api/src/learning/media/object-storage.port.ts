export const OBJECT_STORAGE = Symbol('OBJECT_STORAGE');

export interface ObjectStoragePort {
  resolveControlledObject(objectKey: string, mimeType: string): Promise<string>;
}
