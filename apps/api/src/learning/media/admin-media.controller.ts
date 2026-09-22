import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConsumes,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser, Roles } from '@/auth/decorators';
import type { RequestWithContext } from '@/common/observability/request-context';
import type { MediaAssetSummary } from '@codelife/contracts/learning';
import { AdminMediaService } from './admin-media.service';

@ApiTags('admin-content')
@ApiCookieAuth()
@Roles('ADMIN')
@Controller('admin/content/media')
export class AdminMediaController {
  constructor(private readonly mediaService: AdminMediaService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Envia e normaliza um ativo de imagem para WebP' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Imagem processada e armazenada com sucesso' })
  upload(
    @CurrentUser('id') actorId: string,
    @Req() req: RequestWithContext,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<MediaAssetSummary> {
    return this.mediaService.processAndStore(file, { actorId, requestId: req?.requestId });
  }
}
