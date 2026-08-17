import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import { validateConfig } from './config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { LearningModule } from './learning/learning.module';

let envDirectory = process.cwd();
while (true) {
  const envPath = resolve(envDirectory, '.env');
  if (existsSync(envPath)) {
    // The local .env is the explicit source of truth, including over empty inherited variables.
    loadEnv({ path: envPath, quiet: true, override: true });
    break;
  }
  const parent = dirname(envDirectory);
  if (parent === envDirectory) break;
  envDirectory = parent;
}

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
