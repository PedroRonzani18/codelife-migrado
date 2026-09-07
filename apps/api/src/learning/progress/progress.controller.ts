import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators';
import { ProgressService } from './progress.service';
import {
  CompleteLevelEndpoint,
  GetProgressEndpoint,
  NavigateLevelEndpoint,
  StartLevelEndpoint,
} from './progress-endpoint.decorators';
import {
  CompleteLevelInputDto,
  LevelIdParamDto,
  StartLevelInputDto,
  UpdateCurrentSlideInputDto,
} from '../dto';

@ApiTags('progress')
@ApiCookieAuth()
@Controller('progress')
export class ProgressController {
  constructor(private readonly progress: ProgressService) {}

  @Get()
  @GetProgressEndpoint()
  snapshot(@CurrentUser('id') userId: string) {
    return this.progress.snapshot(userId);
  }

  @Post('levels/:levelId/start')
  @StartLevelEndpoint()
  start(
    @CurrentUser('id') userId: string,
    @Param() params: LevelIdParamDto,
    @Body() _input: StartLevelInputDto,
  ) {
    return this.progress.start(userId, params.levelId);
  }

  @Put('levels/:levelId/current-slide')
  @NavigateLevelEndpoint()
  navigate(
    @CurrentUser('id') userId: string,
    @Param() params: LevelIdParamDto,
    @Body() input: UpdateCurrentSlideInputDto,
  ) {
    return this.progress.navigate(userId, params.levelId, input);
  }

  @Post('levels/:levelId/complete')
  @CompleteLevelEndpoint()
  complete(
    @CurrentUser('id') userId: string,
    @Param() params: LevelIdParamDto,
    @Body() _input: CompleteLevelInputDto,
  ) {
    return this.progress.complete(userId, params.levelId);
  }
}
