// backend/src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import * as path from 'path';
import { getLocalIpAddress } from './utils';

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
  
  const myIP = getLocalIpAddress();

  // 3. Enable CORS for the HTTP endpoints as well
  app.enableCors({
    // STRICT ORIGIN: Do not use '*'
    // You must explicitly list the frontend URL
    origin: [
      'https://127.0.0.1:5173',
      'https://localhost:5173',
      `https://${myIP}:5173`
    ],
    
    // METHODS: Allow standard HTTP methods
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    
    // CREDENTIALS: Required if you are sending cookies/sessions
    // If this is false, Brave will drop cookies silently.
    credentials: true, 
  });

  // 4. Listen on 0.0.0.0 so other computers can connect
  await app.listen(3000, '0.0.0.0');
  
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();