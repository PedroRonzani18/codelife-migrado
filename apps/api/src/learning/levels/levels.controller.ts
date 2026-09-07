import { Controller, Get, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators';
import { LevelIdParamDto } from '../dto';
import { LevelsService } from './levels.service';
import { GetLevelEndpoint } from './levels-endpoint.decorator';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class LevelsController {
  constructor(private readonly levels: LevelsService) {}

  @Get('levels/:levelId')
  @GetLevelEndpoint()
  level(
    @CurrentUser('id') userId: string,
    @Param() params: LevelIdParamDto,
  ) {
    return this.levels.levelDetail(userId, params.levelId);
  }
}
