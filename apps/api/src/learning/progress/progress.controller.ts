import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  snapshot(@Req() request: AuthenticatedRequest) {
    return this.progress.snapshot(request.user.id);
  }

  @Post('levels/:levelId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Inicia um nível disponível no primeiro slide' })
  start(
    @Req() request: AuthenticatedRequest,
    @Param('levelId', new ZodParsePipe(uuidSchema)) levelId: string,
    @Body(new ZodParsePipe(startLevelInputSchema)) _input: StartLevelInput,
  ) {
    return this.progress.start(request.user.id, levelId);
  }

  @Put('levels/:levelId/current-slide')
  @ApiOperation({ summary: 'Persiste uma transição sequencial de slide' })
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
  complete(
    @Req() request: AuthenticatedRequest,
    @Param('levelId', new ZodParsePipe(uuidSchema)) levelId: string,
    @Body(new ZodParsePipe(completeLevelInputSchema)) _input: CompleteLevelInput,
  ) {
    return this.progress.complete(request.user.id, levelId);
  }
}
