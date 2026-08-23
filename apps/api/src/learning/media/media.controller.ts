import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiProduces, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiParam({ name: 'mediaAssetId', format: 'uuid', description: 'UUID público do ativo de mídia.' })
  @ApiProduces('image/svg+xml')
  @ApiResponse({ status: 200, description: 'Fluxo do ativo solicitado, com cache privado.' })
  @ApiResponse({ status: 400, description: 'UUID inválido.' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' })
  @ApiResponse({ status: 404, description: 'Ativo inexistente ou não controlado.' })
  async media(
    @Param('mediaAssetId', new ZodParsePipe(uuidSchema)) mediaAssetId: string,
  ): Promise<StreamableFile> {
    const file = await this.mediaService.controlledFile(mediaAssetId);
    return new StreamableFile(createReadStream(file.path), { type: file.mimeType });
  }
}
