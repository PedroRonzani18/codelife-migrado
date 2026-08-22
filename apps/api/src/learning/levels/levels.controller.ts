import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  level(
    @Req() request: AuthenticatedRequest,
    @Param('levelId', new ZodParsePipe(uuidSchema)) levelId: string,
  ) {
    return this.levels.levelDetail(request.user.id, levelId);
  }
}
