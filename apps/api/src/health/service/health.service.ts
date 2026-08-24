import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(private readonly prisma: PrismaService) {}

  live() {
    return { status: 'ok' as const };
  }

  async ready() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready' as const };
    } catch {
      this.logger.warn('Database readiness check failed');
      throw new ServiceUnavailableException({
        code: 'DEPENDENCY_UNAVAILABLE',
        message: 'Dependência temporariamente indisponível',
        status: 'unavailable',
        checks: { database: 'down' },
      });
    }
  }
}
