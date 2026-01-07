import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GameGateway } from './game/game.gateway';
import { InfoController } from './info/info.controller';
import { InfoService } from './info/info.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MatchResult } from './database/match.interface'

@Module({
  imports: [
	TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'db', // Nome del servizio in docker-compose
      port: 3306,
      username: 'user',
      password: 'user_password',
      database: 'transcendence_db',
      entities: [MatchResult], // Aggiungi la tua classe qui!
      synchronize: true, // Questo crea le tabelle automaticamente (usalo solo in dev!)
    }),
  ],
  controllers: [AppController, InfoController],
  providers: [AppService, GameGateway, InfoService],
})
export class AppModule {}
