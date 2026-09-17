import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './common/filters/auth-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: configService.get<string>(
      'cors.origin',
      'http://localhost:4200',
    ),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Authorization', 'Content-Type'],
    credentials: true,
  });

  app.useGlobalFilters(new AuthExceptionFilter());

  const port = configService.get<number>('port', 8080);

  await app.listen(port);
}

bootstrap();