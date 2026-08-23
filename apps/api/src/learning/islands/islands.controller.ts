import { Controller, Get, Param, Req } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
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
  @ApiParam({ name: 'islandKey', example: 'island-3', description: 'Slug estável da ilha controlada.' })
  @ApiResponse({ status: 200, description: 'Ilha e níveis ordenados com disponibilidade derivada para a pessoa autenticada.' })
  @ApiResponse({ status: 400, description: 'Slug inválido.' })
  @ApiResponse({ status: 401, description: 'Sessão ausente ou inválida.' })
  @ApiResponse({ status: 404, description: 'Ilha não encontrada.' })
  island(
    @Req() request: AuthenticatedRequest,
    @Param('islandKey', new ZodParsePipe(stableKeySchema)) islandKey: string,
  ) {
    return this.islands.islandDetail(request.user.id, islandKey);
  }
}
