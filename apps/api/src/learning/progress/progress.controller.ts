import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Req } from '@nestjs/common';
import { ApiBody, ApiConflictResponse, ApiCookieAuth, ApiForbiddenResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { uuidSchema } from '@codelife/contracts/common';
import {
  completeLevelInputSchema,
  startLevelInputSchema,
  updateCurrentSlideInputSchema,
  type CompleteLevelInput,
  type StartLevelInput,
  type UpdateCurrentSlideInput,
} from '@codelife/contracts/progress';
import type { AuthenticatedRequest } from '@/auth/types/authenticated-request';
import { ZodParsePipe } from '@/common/http/zod-parse.pipe';
import { ProgressService } from './progress.service';

@ApiTags('progress')
@ApiCookieAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  @ApiOperation({ summary: 'Retorna o snapshot canônico da jornada autenticada' })
  @ApiResponse({ status: 200, description: 'Snapshot sem efeitos colaterais, contendo lastVisited e nextRecommended.' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' })
  snapshot(@Req() request: AuthenticatedRequest) {
    return this.progress.snapshot(request.user.id);
  }

  @Post('levels/:levelId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia um nível disponível no primeiro slide' })
  @ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível disponível.' })
  @ApiBody({ schema: { type: 'object', additionalProperties: false, example: {} } })
  @ApiResponse({ status: 200, description: 'Snapshot atualizado. A repetição é idempotente e não reinicia o cursor.' })
  @ApiResponse({ status: 400, description: 'UUID ou corpo inválido.' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Origin não confiável ou LEVEL_BLOCKED.' })
  @ApiResponse({ status: 404, description: 'Nível não encontrado.' })
  start(
    @Req() request: AuthenticatedRequest,
    @Param('levelId', new ZodParsePipe(uuidSchema)) levelId: string,
    @Body(new ZodParsePipe(startLevelInputSchema)) _input: StartLevelInput,
  ) {
    return this.progress.start(request.user.id, levelId);
  }

  @Put('levels/:levelId/current-slide')
  @ApiOperation({ summary: 'Persiste uma transição sequencial de slide' })
  @ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível iniciado.' })
  @ApiBody({ schema: { type: 'object', required: ['slideId'], additionalProperties: false, properties: { slideId: { type: 'string', format: 'uuid' } } } })
  @ApiResponse({ status: 200, description: 'Snapshot atualizado após a transição permitida.' })
  @ApiResponse({ status: 400, description: 'UUID ou corpo inválido.' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Origin não confiável.' })
  @ApiConflictResponse({ description: 'LEVEL_NOT_STARTED ou INVALID_SLIDE_TRANSITION.' })
  @ApiResponse({ status: 404, description: 'Nível ou slide fora do contexto.' })
  navigate(
    @Req() request: AuthenticatedRequest,
    @Param('levelId', new ZodParsePipe(uuidSchema)) levelId: string,
    @Body(new ZodParsePipe(updateCurrentSlideInputSchema)) input: UpdateCurrentSlideInput,
  ) {
    return this.progress.navigate(request.user.id, levelId, input);
  }

  @Post('levels/:levelId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Conclui explicitamente o nível no último slide' })
  @ApiParam({ name: 'levelId', format: 'uuid', description: 'UUID público do nível iniciado.' })
  @ApiBody({ schema: { type: 'object', additionalProperties: false, example: {} } })
  @ApiResponse({ status: 200, description: 'Snapshot atualizado; a primeira conclusão preserva o timestamp.' })
  @ApiResponse({ status: 400, description: 'UUID ou corpo inválido.' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' })
  @ApiForbiddenResponse({ description: 'Origin não confiável.' })
  @ApiConflictResponse({ description: 'LEVEL_NOT_STARTED ou LEVEL_NOT_READY_FOR_COMPLETION.' })
  @ApiResponse({ status: 404, description: 'Nível não encontrado.' })
  complete(
    @Req() request: AuthenticatedRequest,
    @Param('levelId', new ZodParsePipe(uuidSchema)) levelId: string,
    @Body(new ZodParsePipe(completeLevelInputSchema)) _input: CompleteLevelInput,
  ) {
    return this.progress.complete(request.user.id, levelId);
  }
}
