import { BadRequestException, PayloadTooLargeException, UnsupportedMediaTypeException } from '@nestjs/common';
import sharp from 'sharp';
import { AdminMediaService } from './admin-media.service';
import type { IMediaRepository } from './media.repository.interface';
import type { IObjectStorage } from './object-storage.interface';

describe('AdminMediaService', () => {
  let service: AdminMediaService;
  let mediaRepository: jest.Mocked<IMediaRepository>;
  let storage: jest.Mocked<IObjectStorage>;

  beforeEach(() => {
    mediaRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      mediaAssetById: jest.fn(),
      delete: jest.fn(),
    };

    storage = {
      writeMediaObject: jest.fn().mockResolvedValue(undefined),
      deleteMediaObject: jest.fn().mockResolvedValue(undefined),
      resolveControlledObject: jest.fn(),
    };

    service = new AdminMediaService(mediaRepository, storage);
  });

  it('rejects missing file', async () => {
    await expect(service.processAndStore(undefined)).rejects.toThrow(BadRequestException);
  });

  it('rejects file larger than 5 MB', async () => {
    const bigFile = {
      size: 5 * 1024 * 1024 + 1,
      buffer: Buffer.alloc(10),
    } as Express.Multer.File;

    await expect(service.processAndStore(bigFile)).rejects.toThrow(PayloadTooLargeException);
  });

  it('rejects non-image buffer', async () => {
    const invalidFile = {
      size: 100,
      buffer: Buffer.from('hello world not an image'),
    } as Express.Multer.File;

    await expect(service.processAndStore(invalidFile)).rejects.toThrow(UnsupportedMediaTypeException);
  });

  it('rejects SVG images', async () => {
    const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><circle r="10"/></svg>');
    const file = {
      size: svgBuffer.length,
      buffer: svgBuffer,
    } as Express.Multer.File;

    await expect(service.processAndStore(file)).rejects.toThrow(UnsupportedMediaTypeException);
  });

  it('rejects image with dimensions exceeding 4096', async () => {
    const oversizedPng = await sharp({
      create: {
        width: 4097,
        height: 10,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const file = {
      size: oversizedPng.length,
      buffer: oversizedPng,
    } as Express.Multer.File;

    await expect(service.processAndStore(file)).rejects.toThrow(BadRequestException);
  });

  it('processes valid PNG, normalizes to WebP, writes storage and saves DB record', async () => {
    const validPng = await sharp({
      create: {
        width: 100,
        height: 80,
        channels: 3,
        background: { r: 0, g: 255, b: 0 },
      },
    })
      .png()
      .toBuffer();

    const file = {
      size: validPng.length,
      buffer: validPng,
    } as Express.Multer.File;

    mediaRepository.create.mockResolvedValue({
      id: 'asset-1',
      objectKey: 'learning/images/uuid.webp',
      mimeType: 'image/webp',
      sizeBytes: 500,
      width: 100,
      height: 80,
      checksum: 'sha-val',
    });

    const result = await service.processAndStore(file);

    expect(storage.writeMediaObject).toHaveBeenCalledWith(
      expect.stringMatching(/^learning\/images\/.+\.webp$/),
      expect.any(Buffer),
    );
    expect(mediaRepository.create).toHaveBeenCalledWith(expect.objectContaining({
      mimeType: 'image/webp',
      width: 100,
      height: 80,
    }));
    expect(result.id).toBe('asset-1');
    expect(result.mimeType).toBe('image/webp');
  });

  it('compensates storage if DB persistence fails', async () => {
    const validPng = await sharp({
      create: {
        width: 50,
        height: 50,
        channels: 3,
        background: { r: 0, g: 0, b: 255 },
      },
    })
      .png()
      .toBuffer();

    const file = {
      size: validPng.length,
      buffer: validPng,
    } as Express.Multer.File;

    mediaRepository.create.mockRejectedValue(new Error('DB Connection Failure'));

    await expect(service.processAndStore(file)).rejects.toThrow('DB Connection Failure');

    expect(storage.writeMediaObject).toHaveBeenCalled();
    expect(storage.deleteMediaObject).toHaveBeenCalledWith(expect.stringMatching(/^learning\/images\/.+\.webp$/));
  });
});
