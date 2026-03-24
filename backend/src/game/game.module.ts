// backend/src/game/game.module.ts
import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { UsersService } from 'src/users/users.service';


@Module({
  providers: [GameGateway, GameService, UsersService],
  exports: [GameGateway]
})
export class GameModule {}