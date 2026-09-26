import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import type { MediaAssetSummary } from '@codelife/contracts/learning';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { IMediaRepository } from './media.repository.interface';
import type { IObjectStorage } from './object-storage.interface';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_DIMENSION = 4096;
const ALLOWED_INPUT_FORMATS = new Set(['png', 'jpeg', 'webp']);

@Injectable()
export class AdminMediaService {
  private readonly logger = new Logger(AdminMediaService.name);

  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.MEDIA_REPOSITORY)
    private readonly mediaRepository: IMediaRepository,
    @Inject(LEARNING_PROVIDER_KEYS.OBJECT_STORAGE)
    private readonly storage: IObjectStorage,
  ) {}

  async processAndStore(
    file: Express.Multer.File | undefined,
    context?: { actorId?: string; requestId?: string },
  ): Promise<MediaAssetSummary> {
    if (!file || !file.buffer) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Arquivo de imagem não fornecido',
      });
    }

    if (file.size > MAX_FILE_SIZE || file.buffer.length > MAX_FILE_SIZE) {
      throw new PayloadTooLargeException({
        code: 'PAYLOAD_TOO_LARGE',
        message: 'Tamanho do arquivo excede o limite de 5 MB',
      });
    }

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(file.buffer).metadata();
    } catch {
      throw new UnsupportedMediaTypeException({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Arquivo não é uma imagem válida',
      });
    }

    if (!metadata.format || !ALLOWED_INPUT_FORMATS.has(metadata.format)) {
      throw new UnsupportedMediaTypeException({
        code: 'UNSUPPORTED_MEDIA_TYPE',
        message: 'Formato de imagem não suportado. Apenas PNG, JPEG e WebP são permitidos.',
      });
    }

    if (metadata.pages && metadata.pages > 1) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Imagens animadas não são permitidas',
      });
    }

    const inputWidth = metadata.width ?? 0;
    const inputHeight = metadata.height ?? 0;

    if (inputWidth <= 0 || inputHeight <= 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Dimensões da imagem inválidas',
      });
    }

    if (inputWidth > MAX_DIMENSION || inputHeight > MAX_DIMENSION) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Dimensões da imagem excedem o limite máximo de 4096 x 4096',
      });
    }

    let processedBuffer: Buffer;
    try {
      processedBuffer = await sharp(file.buffer)
        .rotate()
        .webp({ quality: 85 })
        .toBuffer();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      const stack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Falha ao normalizar imagem WebP: ${message}`, stack);
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Falha ao processar e normalizar imagem',
      });
    }

    const processedMetadata = await sharp(processedBuffer).metadata();
    const width = processedMetadata.width ?? inputWidth;
    const height = processedMetadata.height ?? inputHeight;
    const byteSize = processedBuffer.length;
    const checksum = createHash('sha256').update(processedBuffer).digest('hex');
    const objectKey = `learning/images/${randomUUID()}.webp`;
    const mimeType = 'image/webp';

    this.logger.log({
      message: 'Gravando ativo de mídia',
      objectKey,
      width,
      height,
      byteSize,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    await this.storage.writeMediaObject(objectKey, processedBuffer);

    try {
      const record = await this.mediaRepository.create({
        objectKey,
        mimeType,
        sizeBytes: byteSize,
        width,
        height,
        checksum,
      });

      return {
        id: record.id,
        objectKey: record.objectKey,
        mimeType: record.mimeType,
        sizeBytes: record.sizeBytes ?? byteSize,
        width: record.width ?? width,
        height: record.height ?? height,
        checksum: record.checksum ?? checksum,
      };
    } catch (error) {
      this.logger.warn({
        message: 'Falha ao registrar ativo de mídia no banco; executando compensação no storage',
        objectKey,
        error: error instanceof Error ? error.message : String(error),
      });
      await this.storage.deleteMediaObject(objectKey);
      throw error;
    }
  }
}
