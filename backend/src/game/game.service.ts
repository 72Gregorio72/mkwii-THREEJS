import { Injectable } from '@nestjs/common';
import { Vector3 } from 'src/utils_types/types';

export interface Player {
  id: string;
  x: number;
  y: number;
  z: number;
  rotation: { x: number, y: number, z: number, w: number }; 
  charId?: string;
  vehicleId?: string;
  isBot?: boolean;
  lap?: number;
  steer?: number;
  drift?: number;
  velocity?: Vector3;
  effects?: {
      isBulletBill?: boolean;
      isStar?: boolean;
      isMega?: boolean;
      isSmall?: boolean;
      isSpinning?: boolean;
  }
}

export interface Item {
  id: string;
  ownerId: string;
  type: string;
  position: [number, number, number];
  velocity: [number, number, number];
}

@Injectable()
export class GameService {
  private players: Map<string, Player> = new Map();
  private items: Map<string, Item> = new Map();

  getWorldState() {
    return {
      players: Array.from(this.players.values()),
      items: Array.from(this.items.values()),
    };
  }

  addItem(item: Item) {
    this.items.set(item.id, item);
  }

  removeItem(id: string) {
    this.items.delete(id);
  }

  updatePlayer(id: string, data: Partial<Player>) {
   const existing = this.players.get(id) || { 
      id, 
      x: 0, y: 0, z: 0, 
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
    
    this.players.set(id, { ...existing, ...data });
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }

  /*applyLightningEffect(attackerId: string) {
	for (let playerId in this.players) {
		if (playerId !== attackerId) {
		this.players[playerId].effects.isSmall = true;
		this.players[playerId].effects.isSpinning = true;

		setTimeout(() => {
			if (this.players[playerId]) this.players[playerId].effects.isSmall = false;
		}, 10000); 

    setTimeout(() => {
			if (this.players[playerId]) this.players[playerId].effects.isSpinning = false;
		}, 4500);
	}
	}
}*/
}