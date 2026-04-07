// Vettori base per posizioni e velocità
export interface Vector3 { x: number; y: number; z: number; }
export interface Quaternion { x: number; y: number; z: number; w: number; }

// Interfaccia per i giocatori nella stanza (Lobby)
export interface RoomPlayer {
  id: string;
  isHost: boolean;
  username?: string;
  icon?: string;
  character?: { id: string; name: string };
  points?: number;
  isReady?: boolean;
}

// Interfaccia per i bot
export interface Bot {
  id: string;
  charId: string;
  vehicleId: string;
}

// Interfaccia per le piste
export interface Track {
  id: string;
  name: string;
}

// Interfaccia per i dettagli della stanza
export interface RoomData {
  roomCode: string;
  roomId: string;
  hostId: string;
  players: RoomPlayer[];
  bots: Bot[];
  gameState: 'LOBBY' | 'INTRO' | 'RACING' | 'FINISHED' | string;
  selectedTrack?: Track;
}

export type User = {
  id: number;
  username: string;
  password: string;
  email: string;
  icon: string;
  onlineWins: number;
  offlineWins: number;
  isLoggedIn: boolean;

  socketId?: string | null;
};

export interface AuthUser {
  id: string | number;
  username: string;
  password?: string;
  email?: string;
  isLoggedIn?: boolean;
}

export interface LoginResponse {
  message: string;
  username: string;
  token: string;
}

export type ValidatedUser = Omit<AuthUser, 'password'>;