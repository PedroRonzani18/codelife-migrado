import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { configureApp } from '@/bootstrap/configure-app';

async function bootstrap() {
  const app = configureApp(await NestFactory.create(AppModule));
  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('port'));
  new Logger('Bootstrap').log(`API listening on port ${config.getOrThrow<number>('port')}`);
}

void bootstrap();
