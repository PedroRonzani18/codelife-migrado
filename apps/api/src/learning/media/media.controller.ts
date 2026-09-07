import { Controller, Get, Header, Param, StreamableFile } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import { MediaAssetIdParamDto } from '../dto';
import { MediaService } from './media.service';
import { GetMediaEndpoint } from './media-endpoint.decorator';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('media/:mediaAssetId')
  @Header('Cache-Control', 'private, max-age=3600')
  @GetMediaEndpoint()
  async media(@Param() params: MediaAssetIdParamDto): Promise<StreamableFile> {
    const file = await this.mediaService.controlledFile(params.mediaAssetId);
    return new StreamableFile(createReadStream(file.path), { type: file.mimeType });
  }
}
