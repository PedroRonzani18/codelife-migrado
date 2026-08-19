import { ValidationPipe, type INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { HttpExceptionFilter } from '@/common/http/http-exception.filter';
import { requestIdMiddleware } from '@/common/observability/request-id.middleware';
import { requestLoggerMiddleware } from '@/common/observability/request-logger.middleware';

export function configureApp(app: INestApplication) {
  const config = app.get(ConfigService);

  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(requestLoggerMiddleware);
  app.enableCors({ origin: config.getOrThrow<string>('webOrigin'), credentials: true });
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  if (config.getOrThrow<boolean>('swaggerEnabled')) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('CodeLife experimental API')
        .setDescription('Contratos da fundação do recorte island-3.')
        .setVersion('0.1.0')
        .addCookieAuth(config.getOrThrow<string>('cookieName'))
        .build(),
    );
    SwaggerModule.setup('docs', app, document, { swaggerOptions: { persistAuthorization: false } });
  }

  return app;
}
