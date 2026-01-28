import { Injectable } from '@nestjs/common';

export interface Player {
  id: string;
  x: number;
  y: number;
  z: number;
  rotation: { x: number, y: number, z: number, w: number }; 
  charId?: string;
  vehicleId?: string;
  steer?: number;
  drift?: number;
  effects?: {
      isBulletBill?: boolean;
      isStar?: boolean;
      isMega?: boolean;
      isSmall?: boolean;
      isSpinning?: boolean;
  }
}

@Injectable()
export class GameService {
  private players: Map<string, Player> = new Map();

  getWorldState() {
    return Array.from(this.players.values());
  }

  updatePlayer(id: string, data: Partial<Player>) {
   const existing = this.players.get(id) || { 
      id, 
      x: 0, y: 0, z: 0, 
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    
    // Merge dei dati. Se data.effects esiste, sovrascriverà quello vecchio
    this.players.set(id, { ...existing, ...data });
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }
}