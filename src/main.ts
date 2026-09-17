import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsConfig } from './config/cors.config';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import { AuthExceptionFilter } from './common/filters/auth-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Enable CORS with strict configuration
  app.enableCors(corsConfig);
  app.useGlobalFilters(new AuthExceptionFilter());
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Get port from environment or default to 8080
  const port = process.env.PORT || 8080;
  
  await app.listen(port);
  console.log(`Gateway running on http://localhost:${port}`);
}

bootstrap();