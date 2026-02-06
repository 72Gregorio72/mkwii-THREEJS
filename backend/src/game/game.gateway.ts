import { 
  SubscribeMessage, 
  WebSocketGateway, 
  OnGatewayInit, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';
import { getLocalIpAddress } from 'src/utils';

const myIP = getLocalIpAddress();

@WebSocketGateway({
  cors: {
    // AGGIUNTO 'https://localhost:8443' alla lista
    origin: [
        'https://localhost:8443', 
        'https://localhost', 
        'https://127.0.0.1:8443', 
        `https://${myIP}:8443`
    ],
    credentials: true,
  },
  transports: ['websocket', 'polling']
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  private items = new Map<string, any>();
  private roomData = new Map<string, { 
    roomCode: string,
    hostId: string, 
    players: any[], 
    bots: any[], 
    gameState: string,
    selectedTrack?: any 
  }>();
  
  // Map socket.id -> roomCode
  private playerRoomMap = new Map<string, string>();

  afterInit() {
    setInterval(() => {
      const worldState = this.gameService.getWorldState();
      this.server.emit('world_update', { players: worldState.players }); 
    }, 1000 / 60);
  }

  handleConnection(client: Socket) {
    console.log(`Player connected: ${client.id}`);
    
    this.gameService.updatePlayer(client.id, { 
      id: client.id, 
      x: 0, 
      y: 0, 
      z: 0,
      rotation: { x: 0, y: 0, z: 0, w: 1 } 
    });

    // Room will be joined via 'create_room' or 'join_room' events
  }

  handleDisconnect(client: Socket) {
    console.log(`Player left: ${client.id}`);
    this.gameService.removePlayer(client.id);

    // Get the room this player was in
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;

    this.playerRoomMap.delete(client.id);

    if (this.roomData.has(roomCode)) {
      const room = this.roomData.get(roomCode);
      if (!room) return;
      
      room.players = room.players.filter(p => p.id !== client.id);

      // If host left, assign new host
      if (room.hostId === client.id && room.players.length > 0) {
        room.hostId = room.players[0].id;
        room.players[0].isHost = true;
        console.log(`New host for room ${roomCode}: ${room.hostId}`);
      }

      // If room is empty, delete it
      if (room.players.length === 0) {
        this.roomData.delete(roomCode);
        console.log(`Room ${roomCode} deleted`);
      } else {
        // Update all players in room with new state
        this.server.emit('room_state', {
          roomCode: room.roomCode,
          hostId: room.hostId,
          players: room.players,
          gameState: room.gameState,
          selectedTrack: room.selectedTrack
        });
      }
    }
  }

  @SubscribeMessage('move_kart')
  handleMove(client: Socket, payload: any) {
    this.gameService.updatePlayer(client.id, payload);
  }

  @SubscribeMessage('bot_update')
  handleBotUpdate(client: Socket, payload: { botId: string, position: any, rotation: any, velocity: any }) {
    // Only host should send bot updates
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;
    
    const room = this.roomData.get(roomCode);
    if (!room || room.hostId !== client.id) return;

    // Update bot state in game service
    this.gameService.updatePlayer(payload.botId, {
      id: payload.botId,
      x: payload.position.x,
      y: payload.position.y,
      z: payload.position.z,
      rotation: payload.rotation,
      velocity: payload.velocity,
      isBot: true
    });
  }

  @SubscribeMessage('set_details')
  handleSetDetails(client: Socket, payload: { charId: string, vehicleId: string }) {
    console.log(`Player ${client.id} selected: ${payload.charId} / ${payload.vehicleId}`);
    this.gameService.updatePlayer(client.id, {
      charId: payload.charId,
      vehicleId: payload.vehicleId
    });
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong');
  }

  @SubscribeMessage('player_hit')
  handlePlayerHit(client: Socket, payload: { victimId: string, type: string }) {
    console.log(`Hit Event: ${client.id} hit ${payload.victimId} with ${payload.type}`);
    this.server.emit('banana-hit', { 
      attackerId: client.id,
      victimId: payload.victimId,
      type: payload.type 
    });
  }

  @SubscribeMessage('use_lightning')
  handleLightning(client: Socket, payload: { attackerId: string }) {
    this.server.emit('lightning-strike', { 
      attackerId: client.id 
    });
    console.log(`Lightning Strike: Attacker ID = ${payload.attackerId}`);
  }

  @SubscribeMessage('spawn_item')
  handleSpawnItem(client: Socket, payload: any) {
    const newItem = { ...payload, id: `it_${Date.now()}`, ownerId: client.id };
    client.broadcast.emit('item_spawned', newItem);
  }

  @SubscribeMessage('remove_item')
  handleRemoveItem(client: Socket, payload: { itemId: string }) {
    this.gameService.removeItem(payload.itemId);
    this.server.emit('item_removed', { itemId: payload.itemId });
  }

  @SubscribeMessage('request_room_state')
  handleRequestRoomState(client: Socket, payload: { roomCode: string }) {
    const roomCode = payload?.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) {
      console.log(`Room ${roomCode} not found for ${client.id}`);
      return;
    }
    
    const room = this.roomData.get(roomCode);

    if (!room) return;
    client.emit('room_state', {
      roomCode: room.roomCode,
      isHost: room.hostId === client.id,
      hostId: room.hostId,
      players: room.players,
      gameState: room.gameState,
      selectedTrack: room.selectedTrack
    });
  }

  @SubscribeMessage('create_room')
  handleCreateRoom(client: Socket, payload: { roomCode: string }) {
    const roomCode = payload.roomCode;
    
    if (this.roomData.has(roomCode)) {
      client.emit('room_error', { message: 'Room already exists' });
      return;
    }

    // Create new room
    this.roomData.set(roomCode, {
      roomCode: roomCode,
      hostId: client.id,
      players: [{ id: client.id, isHost: true }],
      bots: [],
      gameState: 'LOBBY'
    });

    this.playerRoomMap.set(client.id, roomCode);
    
    console.log(`Room ${roomCode} created by ${client.id}`);

    // Send room state
    client.emit('room_state', {
      roomCode: roomCode,
      isHost: true,
      hostId: client.id,
      players: [{ id: client.id, isHost: true }],
      gameState: 'LOBBY',
      selectedTrack: undefined
    });
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, payload: { roomCode: string }) {
    const roomCode = payload.roomCode;
    
    if (!this.roomData.has(roomCode)) {
      client.emit('room_error', { message: 'Room not found' });
      return;
    }

    const room = this.roomData.get(roomCode);
    
    // Check if already in room

      if (!room) return;
    if (room.players.find(p => p.id === client.id)) {
      console.log(`Player ${client.id} already in room ${roomCode}`);
      return;
    }

    // Add player to room
    room.players.push({ id: client.id, isHost: false });
    this.playerRoomMap.set(client.id, roomCode);
    
    console.log(`Player ${client.id} joined room ${roomCode}`);

    // Send room state to all players in room
    this.server.emit('room_state', {
      roomCode: room.roomCode,
      hostId: room.hostId,
      players: room.players,
      gameState: room.gameState,
      selectedTrack: room.selectedTrack
    });
  }

  @SubscribeMessage('select_track')
  handleSelectTrack(client: Socket, payload: { roomCode: string, track: any }) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;
    
    // Only host can select track
    if (room.hostId !== client.id) {
      console.log(`Non-host ${client.id} tried to select track`);
      return;
    }

    console.log(`Host ${client.id} selected track for room ${roomCode}:`, payload.track.name);
    
    // Save track in room data
    room.selectedTrack = payload.track;

  console.log(`Track selection for room ${roomCode} is now:`, room.selectedTrack?.name);
    
    // Broadcast track selection to all players in room
    this.server.emit('track_selected', {
      roomCode: room.roomCode,
      track: payload.track
    });
  }

  @SubscribeMessage('waiting_for_track')
  handleWaitingForTrack(client: Socket, payload: { roomCode: string }) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
	if (!room) return;

	if (room.selectedTrack && room.selectedTrack.name) {
	  console.log(`Track already selected for room ${roomCode}, notifying player ${client.id}`);
	  client.emit('track_selected', {
		roomCode: roomCode,
		track: room.selectedTrack
	  });
	  return;
	}

	if (room.hostId !== client.id) {
	  console.log(`Non-host ${client.id} is waiting for track`);
	  return;
	}

    console.log(`Player ${client.id} is waiting for track in room ${roomCode}`);
  }

  @SubscribeMessage('start_race')
  handleStartRace(client: Socket, payload: { bots: any[], roomCode: string }) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    
      if (!room) return;
    // Only host can start race
    if (room.hostId !== client.id) {
      console.log(`Non-host ${client.id} tried to start race`);
      return;
    }

    console.log(`Host ${client.id} starting race in room ${roomCode} with ${payload.bots.length} bots`);
    
    // Store bots and change game state
    room.bots = payload.bots;
    room.gameState = 'INTRO';

    // Notify all players in room
    this.server.emit('race_start', {
      roomCode: roomCode,
      bots: payload.bots,
      gameState: 'INTRO'
    });

    // Sync bot positions
    payload.bots.forEach(bot => {
      this.gameService.updatePlayer(bot.id, {
        id: bot.id,
        x: 0,
        y: 0,
        z: 0,
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        charId: bot.charId,
        vehicleId: bot.vehicleId,
        isBot: true
      });
    });
  }

  @SubscribeMessage('sync_game_state')
  handleSyncGameState(client: Socket, payload: { gameState: string, countdown?: any, roomCode: string }) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;
    
    // Only host can sync game state
    if (room.hostId !== client.id) return;

    room.gameState = payload.gameState;
    
    // Broadcast to all clients in room
    this.server.emit('game_state_sync', {
      roomCode: roomCode,
      gameState: payload.gameState,
      countdown: payload.countdown
    });
  }
}