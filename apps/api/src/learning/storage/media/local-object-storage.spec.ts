import { LocalObjectStorage } from './local-object-storage';

describe('LocalObjectStorage', () => {
  const storage = new LocalObjectStorage();

  it('resolves a versioned fixture asset with its declared MIME type', async () => {
    await expect(storage.resolveControlledObject('learning/island-3/variables.svg', 'image/svg+xml')).resolves.toMatch(/assets\/learning\/island-3\/variables\.svg$/);
  });

  it.each([
    ['an object that escapes the controlled root', '../.env', 'text/plain'],
    ['an unsupported MIME type', 'learning/island-3/variables.svg', 'text/plain'],
  ])('rejects %s', async (_description, objectKey, mimeType) => {
    await expect(storage.resolveControlledObject(objectKey, mimeType)).rejects.toThrow();
  });
});
