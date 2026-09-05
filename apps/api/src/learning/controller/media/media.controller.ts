import { Controller, Get, Header, Inject, Param, StreamableFile } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { createReadStream } from 'node:fs';
import { LEARNING_PROVIDER_KEYS } from '../../constants';
import { GetMediaEndpoint } from '../decorators/media-endpoint.decorator';
import { MediaAssetIdParamDto } from '../../dto';
import type { IMediaService } from '../../service/media/media.service.interface';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class MediaController {
  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.MEDIA_SERVICE)
    private readonly mediaService: IMediaService,
  ) {}

  @Get('media/:mediaAssetId')
  @Header('Cache-Control', 'private, max-age=3600')
  @GetMediaEndpoint()
  async media(@Param() params: MediaAssetIdParamDto): Promise<StreamableFile> {
    const file = await this.mediaService.controlledFile(params.mediaAssetId);
    return new StreamableFile(createReadStream(file.path), { type: file.mimeType });
  }
}
