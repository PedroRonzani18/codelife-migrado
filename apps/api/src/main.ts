import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.enableCors({ origin: config.getOrThrow<string>('webOrigin'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  const document = SwaggerModule.createDocument(app, new DocumentBuilder().setTitle('CodeLife experimental API').setDescription('Contratos da fundação do recorte island-3.').setVersion('0.1.0').addCookieAuth(config.getOrThrow<string>('cookieName')).build());
  SwaggerModule.setup('docs', app, document);
  await app.listen(config.getOrThrow<number>('port'));
}

void bootstrap();
