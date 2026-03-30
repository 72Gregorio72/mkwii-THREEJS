// backend/src/game/game.module.ts
import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GameService } from './game.service';
import { UsersService } from 'src/users/users.service';
import { NotificationsService } from 'src/notifications/notifications.service';


@Module({
  providers: [GameGateway, GameService, UsersService, NotificationsService],
  exports: [GameGateway]
})
export class GameModule {}