import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators';
import { LEARNING_PROVIDER_KEYS } from '../../constants';
import { GetLevelEndpoint } from '../decorators/levels-endpoint.decorator';
import { LevelIdParamDto } from '../../dto';
import type { ILevelsService } from '../../service/levels/levels.service.interface';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class LevelsController {
  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.LEVELS_SERVICE)
    private readonly levels: ILevelsService,
  ) {}

  @Get('levels/:levelId')
  @GetLevelEndpoint()
  level(
    @CurrentUser('id') userId: string,
    @Param() params: LevelIdParamDto,
  ) {
    return this.levels.levelDetail(userId, params.levelId);
  }
}
