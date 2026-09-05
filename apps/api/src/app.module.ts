import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { config as loadEnvironment } from 'dotenv';
import { resolve } from 'node:path';
import { validateConfig } from '@/config';
import { PrismaModule } from '@/prisma/prisma.module';
import { AuthModule } from '@/auth/auth.module';
import { HealthModule } from '@/health/health.module';
import { LearningModule } from '@/learning/learning.module';

loadEnvironment({ path: resolve(__dirname, '../.env'), override: false });

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ignoreEnvFile: true,
      validate: validateConfig,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    LearningModule,
  ],
})
export class AppModule {}
