import { Controller, Get, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { stableKeySchema } from 'contracts';
import { ZodParsePipe } from '@/common/http/zod-parse.pipe';
import { IslandsService } from './islands.service';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class IslandsController {
  constructor(private readonly islands: IslandsService) {}

  @Get('islands/:islandKey')
  @ApiOperation({ summary: 'Detalha a fixture experimental da ilha' })
  island(@Param('islandKey', new ZodParsePipe(stableKeySchema)) islandKey: string) {
    return this.islands.islandDetail(islandKey);
  }
}
