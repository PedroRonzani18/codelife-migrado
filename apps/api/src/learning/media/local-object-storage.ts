import { access } from 'node:fs/promises';
import { normalize, relative, resolve } from 'node:path';
import type { IObjectStorage } from './object-storage.interface';

const localMimeTypes: Readonly<Record<string, string>> = {
  '.svg': 'image/svg+xml',
};

export class LocalObjectStorage implements IObjectStorage {
  constructor(private readonly rootDirectory = resolve(__dirname, '../../../assets')) {}

  async resolveControlledObject(objectKey: string, mimeType: string): Promise<string> {
    const normalizedKey = normalize(objectKey);
    const absolutePath = resolve(this.rootDirectory, normalizedKey);
    const pathFromRoot = relative(this.rootDirectory, absolutePath);
    if (pathFromRoot.startsWith('..') || pathFromRoot === '') {
      throw new Error(`Local media object key is outside the controlled root: ${objectKey}`);
    }

    const extension = normalizedKey.slice(normalizedKey.lastIndexOf('.'));
    if (localMimeTypes[extension] !== mimeType) {
      throw new Error(`Unsupported MIME type for local media object ${objectKey}: ${mimeType}`);
    }

    await access(absolutePath);
    return absolutePath;
  }
}
