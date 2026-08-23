import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { uuidSchema } from '@codelife/contracts/common';
import { createReadStream } from 'node:fs';
import { ZodParsePipe } from '@/common/http/zod-parse.pipe';
import { MediaService } from './media.service';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('media/:mediaAssetId')
  @Header('Cache-Control', 'private, max-age=3600')
  @ApiOperation({ summary: 'Entrega um ativo de mídia controlado' })
  @ApiProduces('image/svg+xml')
  async media(
    @Param('mediaAssetId', new ZodParsePipe(uuidSchema)) mediaAssetId: string,
  ): Promise<StreamableFile> {
    const file = await this.mediaService.controlledFile(mediaAssetId);
    return new StreamableFile(createReadStream(file.path), { type: file.mimeType });
  }
}
