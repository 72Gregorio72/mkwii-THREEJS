import { Injectable } from '@nestjs/common';

export interface Player {
  id: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
}

@Injectable()
export class GameService {
  // Store players in a Map for fast lookups by ID
  private players: Map<string, Player> = new Map();

  getWorldState() {
    // Convert Map to Array or Object to send over network
    return Array.from(this.players.values());
  }

  updatePlayer(id: string, data: Partial<Player>) {
    const existing = this.players.get(id) || { id, x:0, y:0, z:0, rotation:0 };
    this.players.set(id, { ...existing, ...data });
  }

  removePlayer(id: string) {
    this.players.delete(id);
  }
}