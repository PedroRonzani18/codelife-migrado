import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateConfig } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { LearningModule } from './learning/learning.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Turbo runs this workspace from apps/api; local configuration lives at the monorepo root.
      envFilePath: ['../../.env', '.env'],
      validate: validateConfig,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    LearningModule,
  ],
})
export class AppModule {}
