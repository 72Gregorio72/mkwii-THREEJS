import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Permette a chiunque di collegarsi (per ora va bene)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });
  // ------------------------------

  await app.listen(3000);
}
bootstrap();
