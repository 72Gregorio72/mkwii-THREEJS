// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // 1. Load your certificates (Make sure these files are in your project root)
  // If you used mkcert, these are key.pem and cert.pem
  const httpsOptions = {
    key: fs.readFileSync(path.resolve('./certs/key.pem')),
    cert: fs.readFileSync(path.resolve('./certs/cert.pem')),
  };

  // 2. Pass httpsOptions to create
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

  // 3. Enable CORS for the HTTP endpoints as well
  app.enableCors();

  // 4. Listen on 0.0.0.0 so other computers can connect
  await app.listen(3000, '0.0.0.0');
  
  console.log(`Application is running on: https://${await app.getUrl()}`);
}
bootstrap();