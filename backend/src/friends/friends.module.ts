import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';
import { UsersService } from 'src/users/users.service';

@Module({
  controllers: [FriendsController],
  providers: [FriendsService, UsersService],
  exports: [FriendsService] // Esportalo se dovesse servire ad altri moduli (es. Socket/Gateway)
})
export class FriendsModule {}