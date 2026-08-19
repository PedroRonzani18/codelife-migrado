import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/decorators/public.decorator';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Alias compatível da verificação de liveness' })
  check() { return this.health.live(); }

  @Public()
  @Get('live')
  @ApiOperation({ summary: 'Verifica que o processo da API está vivo' })
  live() { return this.health.live(); }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Verifica que a API e suas dependências estão disponíveis' })
  ready() { return this.health.ready(); }
}
