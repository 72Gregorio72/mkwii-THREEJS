import { Module } from '@nestjs/common';
import { FriendsController } from './friends.controller';
import { FriendsService } from './friends.service';

@Module({
  controllers: [FriendsController],
  providers: [FriendsService],
  exports: [FriendsService] // Esportalo se dovesse servire ad altri moduli (es. Socket/Gateway)
})
export class FriendsModule {}