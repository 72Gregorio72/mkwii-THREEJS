import { Quaternion, Vector3, Track, Bot } from 'src/utils_types/types'; // Assicurati che i percorsi siano corretti

export interface MoveKartPayload {
  x: number;
  y: number;
  z: number;
  rotation: Quaternion;
  steer: number;
  drift: number;
  speed: number;
  driftLevel: number;
  effects: {
    isBulletBill?: boolean;
    isStar?: boolean;
    isMega?: boolean;
    isSmall?: boolean;
    isSpinning?: boolean;
  };
}

export interface SpawnItemPayload {
  id: string;
  type: string;
  position: [number, number, number];
  velocity: [number, number, number];
  isLocal?: boolean;
  [key: string]: any;
}

export interface SyncGameStatePayload {
  roomCode: string;
  gameState: 'LOBBY' | 'INTRO' | 'COUNTDOWN' | 'RACING' | 'FINISHED' | 'LOADING' | string;
  countdown?: number | string | null; // Può essere un numero (3,2,1) o la stringa 'START!'
}

export interface StartRacePayload {
  roomCode: string;
  bots: Bot[];
}

// Altri payload minori per pulizia del codice
export interface RoomCodePayload { roomCode: string; }
export interface RoomUserPayload { roomCode: string; username: string; }
export interface ItemIdPayload { itemId: string; }