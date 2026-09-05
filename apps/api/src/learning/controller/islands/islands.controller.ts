import { Controller, Get, Inject, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators';
import { LEARNING_PROVIDER_KEYS } from '../../constants';
import { GetIslandEndpoint } from '../decorators/islands-endpoint.decorator';
import { IslandKeyParamDto } from '../../dto';
import type { IIslandsService } from '../../service/islands/islands.service.interface';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class IslandsController {
  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.ISLANDS_SERVICE)
    private readonly islands: IIslandsService,
  ) {}

  @Get('islands/:islandKey')
  @GetIslandEndpoint()
  island(
    @CurrentUser('id') userId: string,
    @Param() params: IslandKeyParamDto,
  ) {
    return this.islands.islandDetail(userId, params.islandKey);
  }
}
