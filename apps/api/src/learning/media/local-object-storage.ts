import { access, mkdir, rename, unlink, writeFile } from 'node:fs/promises';
import { dirname, normalize, relative, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import type { IObjectStorage } from './object-storage.interface';

const localMimeTypes: Readonly<Record<string, string>> = {
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

export class LocalObjectStorage implements IObjectStorage {
  constructor(
    private readonly rootDirectory = process.env.MEDIA_STORAGE_ROOT
      ? resolve(process.env.MEDIA_STORAGE_ROOT)
      : resolve(__dirname, '../../../assets'),
  ) {}

  async resolveControlledObject(objectKey: string, mimeType: string): Promise<string> {
    const absolutePath = this.resolveSafePath(objectKey);

    const extension = absolutePath.slice(absolutePath.lastIndexOf('.')).toLowerCase();
    if (localMimeTypes[extension] !== mimeType) {
      throw new Error(`Unsupported MIME type for local media object ${objectKey}: ${mimeType}`);
    }

    await access(absolutePath);
    return absolutePath;
  }

  async writeMediaObject(objectKey: string, buffer: Buffer): Promise<void> {
    const absolutePath = this.resolveSafePath(objectKey);
    const parentDir = dirname(absolutePath);
    await mkdir(parentDir, { recursive: true });

    const tempPath = `${absolutePath}.tmp.${Date.now()}.${randomUUID()}`;
    await writeFile(tempPath, buffer);
    await rename(tempPath, absolutePath);
  }

  async deleteMediaObject(objectKey: string): Promise<void> {
    try {
      const absolutePath = this.resolveSafePath(objectKey);
      await unlink(absolutePath);
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException)?.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  private resolveSafePath(objectKey: string): string {
    const normalizedKey = normalize(objectKey);
    const absolutePath = resolve(this.rootDirectory, normalizedKey);
    const pathFromRoot = relative(this.rootDirectory, absolutePath);
    if (pathFromRoot.startsWith('..') || pathFromRoot === '') {
      throw new Error(`Local media object key is outside the controlled root: ${objectKey}`);
    }
    return absolutePath;
  }
}
