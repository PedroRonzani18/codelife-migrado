import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { LocalObjectStorage } from './local-object-storage';

describe('LocalObjectStorage', () => {
  const defaultStorage = new LocalObjectStorage();

  it('resolves a versioned fixture asset with its declared MIME type', async () => {
    await expect(defaultStorage.resolveControlledObject('learning/island-3/variables.svg', 'image/svg+xml')).resolves.toMatch(/assets\/learning\/island-3\/variables\.svg$/);
  });

  it.each([
    ['an object that escapes the controlled root', '../.env', 'text/plain'],
    ['an unsupported MIME type', 'learning/island-3/variables.svg', 'text/plain'],
  ])('rejects %s', async (_description, objectKey, mimeType) => {
    await expect(defaultStorage.resolveControlledObject(objectKey, mimeType)).rejects.toThrow();
  });

  describe('write and delete operations in temp root', () => {
    let tempDir: string;
    let tempStorage: LocalObjectStorage;

    beforeEach(async () => {
      tempDir = await mkdtemp(join(tmpdir(), 'media-test-'));
      tempStorage = new LocalObjectStorage(tempDir);
    });

    afterEach(async () => {
      await rm(tempDir, { recursive: true, force: true });
    });

    it('writes and resolves a webp object safely', async () => {
      const buffer = Buffer.from('fake-webp-content');
      await tempStorage.writeMediaObject('images/test.webp', buffer);

      const resolved = await tempStorage.resolveControlledObject('images/test.webp', 'image/webp');
      const saved = await readFile(resolved);
      expect(saved.toString()).toBe('fake-webp-content');
    });

    it('deletes an existing object and ignores deleting nonexistent object', async () => {
      const buffer = Buffer.from('to-delete');
      await tempStorage.writeMediaObject('images/to-delete.webp', buffer);
      await tempStorage.deleteMediaObject('images/to-delete.webp');

      await expect(tempStorage.resolveControlledObject('images/to-delete.webp', 'image/webp')).rejects.toThrow();
      await expect(tempStorage.deleteMediaObject('nonexistent.webp')).resolves.toBeUndefined();
    });

    it('rejects writing outside root', async () => {
      await expect(tempStorage.writeMediaObject('../outside.webp', Buffer.from('bad'))).rejects.toThrow();
    });
  });
});
