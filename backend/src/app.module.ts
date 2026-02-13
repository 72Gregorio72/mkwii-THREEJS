import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfoController } from './info/info.controller';
import { InfoService } from './info/info.service';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [GameModule, AuthModule],
  controllers: [AppController, InfoController, AuthController],
  providers: [AppService, InfoService, AuthService],
})
export class AppModule {}
