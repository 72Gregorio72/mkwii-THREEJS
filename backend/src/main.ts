import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs'; // <--- Importa fs

async function bootstrap() {
const httpsOptions = {
    key: fs.readFileSync('./certs/key.pem'),
    cert: fs.readFileSync('./certs/cert.pem'),
  };

  // Passa httpsOptions al metodo create
  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.enableCors({
    origin: '*', 
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  const config = new DocumentBuilder()
    .setTitle('Mario Kart API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Ascolta su HTTPS
  await app.listen(3000, '0.0.0.0');
  console.log(`Application is running on: https://localhost:3000`);
}
bootstrap();
