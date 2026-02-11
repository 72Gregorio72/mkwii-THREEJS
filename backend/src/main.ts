// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // Percorso dove monterai i certificati dentro il container
  const httpsOptions = {
    key: fs.readFileSync('/etc/certs/key.pem'),
    cert: fs.readFileSync('/etc/certs/cert.pem'),
  };

  // Passa httpsOptions come secondo argomento
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  app.enableCors({
    origin: true,
    credentials: true,
  });

  
  app.setGlobalPrefix('api'); 
  // NestJS ora ascolterà in HTTPS sulla porta 3000
  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: https://localhost:3000`);
}
bootstrap();