import { Controller, Get, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@/auth/decorators';
import { IslandKeyParamDto } from '../dto';
import { IslandsService } from './islands.service';
import { GetIslandEndpoint, GetIslandsEndpoint } from './islands-endpoint.decorator';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class IslandsController {
  constructor(private readonly islands: IslandsService) {}

  @Get('islands')
  @GetIslandsEndpoint()
  catalog(@CurrentUser('id') userId: string) {
    return this.islands.catalog(userId);
  }

  @Get('islands/:islandKey')
  @GetIslandEndpoint()
  island(
    @CurrentUser('id') userId: string,
    @Param() params: IslandKeyParamDto,
  ) {
    return this.islands.islandDetail(userId, params.islandKey);
  }
}
