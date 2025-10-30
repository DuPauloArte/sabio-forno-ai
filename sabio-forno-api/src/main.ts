// Local: sabio-forno-api/src/main.ts

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express'; // Importa o tipo Express

async function bootstrap() {
  // CORREÇÃO: Usa NestExpressApplication para ter acesso ao .use()
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    // CORREÇÃO: Habilita o rawBody para o webhook do Stripe
    rawBody: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.enableCors();

  await app.listen(3000, '0.0.0.0');
}
bootstrap();