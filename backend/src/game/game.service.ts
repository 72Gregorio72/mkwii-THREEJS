// backend/src/game/game.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class GameService {
  private players = new Map<string, any>(); 

  updatePlayer(id: string, payload: any) {
    this.players.set(id, payload);
  }

  // Add this method
  removePlayer(id: string) {
    this.players.delete(id);
  }

  getWorldState() {
    return Object.fromEntries(this.players);
  }
}