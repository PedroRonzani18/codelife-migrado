import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiForbiddenResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { uuidSchema } from '@codelife/contracts/common';
import type { AuthenticatedRequest } from '@/auth/types/authenticated-request';
import { ZodParsePipe } from '@/common/http/zod-parse.pipe';
import { LevelsService } from './levels.service';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class LevelsController {
  constructor(private readonly levels: LevelsService) {}

  @Get('levels/:levelId')
  @ApiOperation({ summary: 'Retorna o conteúdo ordenado de um nível' })
  @ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível.' })
  @ApiResponse({ status: 200, description: 'Nível, slides ordenados e vínculos previousSlideId/nextSlideId.' })
  @ApiResponse({ status: 400, description: 'UUID inválido.' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'LEVEL_BLOCKED quando o predecessor ainda não foi concluído.' })
  @ApiResponse({ status: 404, description: 'Nível não encontrado.' })
  level(
    @Req() request: AuthenticatedRequest,
    @Param('levelId', new ZodParsePipe(uuidSchema)) levelId: string,
  ) {
    return this.levels.levelDetail(request.user.id, levelId);
  }
}
