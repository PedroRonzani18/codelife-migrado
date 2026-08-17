import { Controller, Get, Param } from '@nestjs/common';
import { ApiCookieAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { LearningService } from './learning.service';

@ApiTags('learning')
@ApiCookieAuth()
@Controller('learning')
export class LearningController {
  constructor(private readonly learning: LearningService) {}

  @Get('islands/:islandKey')
  @ApiOperation({ summary: 'Detalha a fixture experimental da ilha' })
  island(@Param('islandKey') islandKey: string) { return this.learning.islandDetail(islandKey); }

  @Get('fixture-integrity')
  @ApiOperation({ summary: 'Confere a contagem esperada da fixture experimental' })
  fixtureIntegrity() { return this.learning.assertSeedIntegrity(); }
}
