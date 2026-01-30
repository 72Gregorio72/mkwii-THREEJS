// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import { getLocalIpAddress } from './utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // Niente HTTPS qui!
  
  app.enableCors({
    origin: true, // Nginx gestisce la sicurezza, in dev puoi permettere l'origin
    credentials: true,
  });

  await app.listen(3000, '0.0.0.0');
}
bootstrap();