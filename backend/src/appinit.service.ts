import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { UsersService } from './users/users.service';

@Injectable()
export class AppInitService implements OnApplicationBootstrap {
  constructor(private readonly usersService: UsersService) {}

  // Questo metodo viene chiamato automaticamente da NestJS
  // quando il server ha finito di caricare e sta per accettare connessioni
  async onApplicationBootstrap() {
    console.log('[Server Start]: Setting offline status for all users...');
    try {
        await this.usersService.setAllUsersOffline();
        console.log('[Server Start]: Reset offline status for all users successfully.');
    } catch (error) {
        console.error('[Server Start]: Error occurred while resetting offline status:', error);
    }
  }
}