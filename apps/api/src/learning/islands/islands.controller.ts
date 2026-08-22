import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { stableKeySchema } from '@codelife/contracts/common';
import { ZodParsePipe } from '@/common/http/zod-parse.pipe';
import type { AuthenticatedRequest } from '@/auth/types/authenticated-request';
import { IslandsService } from './islands.service';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class IslandsController {
  constructor(private readonly islands: IslandsService) {}

  @Get('islands/:islandKey')
  @ApiOperation({ summary: 'Detalha a fixture experimental da ilha' })
  island(
    @Req() request: AuthenticatedRequest,
    @Param('islandKey', new ZodParsePipe(stableKeySchema)) islandKey: string,
  ) {
    return this.islands.islandDetail(request.user.id, islandKey);
  }
}
