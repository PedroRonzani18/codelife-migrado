import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { GetHealthAliasEndpoint, GetHealthLiveEndpoint, GetHealthReadyEndpoint } from './decorators/health-endpoint.decorators';
import { HealthService } from '../service/health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly health: HealthService) {}

  @Public()
  @Get()
  @GetHealthAliasEndpoint()
  check() { return this.health.live(); }

  @Public()
  @Get('live')
  @GetHealthLiveEndpoint()
  live() { return this.health.live(); }

  @Public()
  @Get('ready')
  @GetHealthReadyEndpoint()
  ready() { return this.health.ready(); }
}
