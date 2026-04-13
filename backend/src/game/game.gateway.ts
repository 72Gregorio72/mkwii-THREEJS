import { 
  SubscribeMessage, 
  WebSocketGateway, 
  OnGatewayInit, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService, Player } from './game.service';
import { getLocalIpAddress } from 'src/utils_types/utils';
import { UsersService } from 'src/users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { RoomData, RoomPlayer, Quaternion, Vector3, Track, User } from 'src/utils_types/types';
import type { ItemIdPayload, MoveKartPayload, RoomCodePayload, RoomUserPayload, SpawnItemPayload, StartRacePayload, SyncGameStatePayload } from 'src/utils_types/socket-payloads';
import { NotificationsService } from 'src/notifications/notifications.service';

const myIP = getLocalIpAddress();

function generateRoomId(length = 16): string {
  const roomId = Math.random().toString(36).substring(2, length + 2).toUpperCase();
  return roomId;
}

@WebSocketGateway({
  cors: {
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
  server!: Server;

  constructor(
    private readonly gameService: GameService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly notificationsService: NotificationsService
  ) {}

  // private items = new Map<string, any>();
  private roomData = new Map<string, RoomData>();
  private scoringAppliedRooms = new Set<string>();
  
  // Map socket.id -> roomCode
  private playerRoomMap = new Map<string, string>();
  // Map roomId -> roomCode (per lookup inverso se serve)
  private roomIdToCode = new Map<string, string>();

  afterInit() {
    setInterval(() => {
      for (const [roomCode, room] of this.roomData.entries()) {
        const playerIds = room.players.map(p => p.id);
        const botIds = (room.bots || []).map(b => b.id);
        const allIds = [...playerIds, ...botIds];
        
        const worldState = this.gameService.getWorldState();
        const roomPlayers = worldState.players.filter(p => allIds.includes(p.id));
        
        // Emetti SOLO alla room specifica
        this.server.to(roomCode).emit('world_update', { players: roomPlayers });
      }
    }, 1000 / 60);
  }

  async handleConnection(client: Socket) {
    console.log(`Player connected: ${client.id}`);
    const token = client.handshake.auth.token;

    if (token) {
      try {
        const secret = this.configService.get<string>('JWT_SECRET');
        const payload = this.jwtService.verify(token, { secret });
        
        const username = payload.username;

        const user = await this.usersService.findOne(username);
        
        if (!user) {
          // Se l'account è stato cancellato, il token non deve più funzionare
          throw new Error('User not found in database');
        }

        await this.usersService.updateSocketAndLoginStatus(username, client.id, true);
        
        client.data.username = username;
        
        // console.log(`Utente autenticato: ${username} con socket ${client.id}`);
        client.emit('auth_success', { username: username, isLoggedIn: true }); // eventuale conferma al client
      } catch (error) {
        console.error(`Token non valido per ${client.id}:`, error);
        client.emit('unauthorized', { message: 'Token scaduto o non valido' });
        client.disconnect();
      }
    }
    this.gameService.updatePlayer(client.id, { 
      id: client.id, 
      x: 0, 
      y: 0, 
      z: 0,
      rotation: { x: 0, y: 0, z: 0, w: 1 } 
    });
  }

 async handleDisconnect(client: Socket) {
    console.log(`Player left: ${client.id}`);
    this.gameService.removePlayer(client.id);

    const username = client.data.username;

    if (username) {
      try {
        await this.usersService.updateLoginStatus(username, false);
      } catch (error) {
        console.error(`Errore nel DB durante la disconnessione di ${username}`, error);
      }
    } else {
      try {
        await this.usersService.updateLoginStatusBySocketId(client.id, false);
      } catch (e) {console.error(`No user found for socket ${client.id}:`, e);}
    }

    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;

    this.playerRoomMap.delete(client.id);

    if (this.roomData.has(roomCode)) {
      const room = this.roomData.get(roomCode);
      if (!room) return;
      
      if (room.hostId === client.id) {
        console.log(`Host disconnected. Closing room ${roomCode} (${room.roomId})`);
        
        // Avvisiamo gli altri client nella stanza
        this.server.to(roomCode).emit('room_closed', { message: 'The host has left the game.' });
        
        // Pulizia dati
        (room.bots || []).forEach(bot => this.gameService.removePlayer(bot.id));
        room.players.forEach(p => this.playerRoomMap.delete(p.id));
        this.roomIdToCode.delete(room.roomId);
        this.roomData.delete(roomCode);
        this.server.socketsLeave(roomCode);
      } else {
        // Un GIOCATORE NORMALE è uscito
        room.players = room.players.filter(p => p.id !== client.id);

        if (room.players.length === 0) {
          (room.bots || []).forEach(bot => this.gameService.removePlayer(bot.id));
          this.roomIdToCode.delete(room.roomId);
          this.roomData.delete(roomCode);
          console.log(`Room ${roomCode} (${room.roomId}) deleted`);
        } else {
          this.server.to(roomCode).emit('room_state', {
            roomCode: room.roomCode,
            roomId: room.roomId,
            hostId: room.hostId,
            players: room.players,
            gameState: room.gameState,
            selectedTrack: room.selectedTrack
          });
        }
      }
    }
  }

  @SubscribeMessage('move_kart')
  handleMove(client: Socket, payload: MoveKartPayload) {
    this.gameService.updatePlayer(client.id, payload);
  }

  @SubscribeMessage('update_lap')
  handleUpdateLap(client: Socket, payload: { lap: number }) {
    console.log(`Player ${client.id} updated lap to ${payload.lap}`);
    this.gameService.updatePlayer(client.id, {
      lap: payload.lap
    });
    
    // Broadcast the lap update to all players in the room
    const roomCode = this.playerRoomMap.get(client.id);
    if (roomCode) {
      this.server.to(roomCode).emit('player_lap_updated', {
        playerId: client.id,
        lap: payload.lap
      });
    }
  }

  @SubscribeMessage('bot_update')
  handleBotUpdate(client: Socket, payload: { botId: string, position: Vector3, rotation: Quaternion, velocity: Vector3 }) {
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;
    
    const room = this.roomData.get(roomCode);
    if (!room || room.hostId !== client.id) return;

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
  handleSetDetails(client: Socket, payload: { charId: string, vehicleId: string, characterName: string }) {
    console.log(`Player ${client.id} selected: ${payload.charId} / ${payload.vehicleId}`);
    this.gameService.updatePlayer(client.id, {
      charId: payload.charId,
      vehicleId: payload.vehicleId
    });

    // Aggiorna il player nella stanza con il character name
    const roomCode = this.playerRoomMap.get(client.id);
    if (roomCode) {
      const room = this.roomData.get(roomCode);
      if (room) {
        const playerInRoom = room.players.find(p => p.id === client.id);
        if (playerInRoom) {
          playerInRoom.character = {
            id: payload.charId,
            name: payload.characterName
          };
          
          // Broadcast the updated room state
          this.server.to(roomCode).emit('room_state', {
            roomCode: room.roomCode,
            roomId: room.roomId,
            hostId: room.hostId,
            players: room.players,
            gameState: room.gameState,
            selectedTrack: room.selectedTrack
          });
        }
      }
    }

  }

  @SubscribeMessage('ping')
  handlePing(client: Socket) {
    client.emit('pong');
  }

  @SubscribeMessage('player_hit')
  handlePlayerHit(client: Socket, payload: { victimId: string, type: string }) {
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;
    
    console.log(`Hit Event in room ${roomCode}: ${client.id} hit ${payload.victimId} with ${payload.type}`);
    this.server.to(roomCode).emit('banana-hit', { 
      attackerId: client.id,
      victimId: payload.victimId,
      type: payload.type 
    });
  }
  
  @SubscribeMessage('use_lightning')
  handleLightning(client: Socket, payload: { attackerId: string }) {
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;

    this.server.to(roomCode).emit('lightning-strike', { 
      attackerId: client.id 
    });
    console.log(`Lightning Strike in room ${roomCode}: Attacker ID = ${payload.attackerId}`);
  }

  @SubscribeMessage('spawn_item')
  handleSpawnItem(client: Socket, payload: SpawnItemPayload) {
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;

    // Usiamo l'ID generato dal frontend (payload.id) per mantenere la sincronia
    const newItem = { 
      ...payload, 
      id: payload.id, 
      ownerId: client.id 
    };
    client.to(roomCode).emit('item_spawned', newItem);
  }

  @SubscribeMessage('remove_item')
  handleRemoveItem(client: Socket, payload: ItemIdPayload) {
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode) return;

    this.gameService.removeItem(payload.itemId);
    this.server.to(roomCode).emit('item_removed', { itemId: payload.itemId });
  }

  @SubscribeMessage('request_room_state')
  handleRequestRoomState(client: Socket, payload: RoomCodePayload) {
    const roomCode = payload?.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) {
      console.log(`Room ${roomCode} not found for ${client.id}`);
      client.emit('room_error', { message: 'La stanza non esiste più o è stata chiusa.' });
      return;
    }
    
    const room = this.roomData.get(roomCode);
    if (!room) return;

    client.emit('room_state', {
      roomCode: room.roomCode,
      roomId: room.roomId,
      isHost: room.hostId === client.id,
      hostId: room.hostId,
      players: room.players,
      gameState: room.gameState,
      selectedTrack: room.selectedTrack
    });
  }

  @SubscribeMessage('create_room')
  async handleCreateRoom(client: Socket, payload: RoomUserPayload) {
    const roomCode = payload.roomCode;
    
    if (this.roomData.has(roomCode)) {
      client.emit('room_error', { message: 'Room already exists' });
      return;
    }

    // Genera roomId unico lato server
    let roomId = generateRoomId(10);
    while (this.roomIdToCode.has(roomId)) {
      roomId = generateRoomId(10);
    }

    client.join(roomCode);

    const hostUser = await this.usersService.findOne(payload.username);

    this.roomData.set(roomCode, {
      roomCode: roomCode,
      roomId: roomId,
      hostId: client.id,
      players: [{ id: client.id, isHost: true, username: payload.username, icon: hostUser?.icon || 'Mario.png', character: { id: '', name: '' }, points: 0, isReady: false }],
      bots: [],
      gameState: 'LOBBY'
    });

    const room = this.roomData.get(roomCode);
    if (!room) return;

    this.playerRoomMap.set(client.id, roomCode);
    this.roomIdToCode.set(roomId, roomCode);
    
    console.log(`Room created — code: ${roomCode}, id: ${roomId}, by: ${client.id}`);

    client.emit('room_state', {
      roomCode: roomCode,
      roomId: roomId,
      isHost: true,
      hostId: client.id,
      players: room.players,
      gameState: 'LOBBY',
      selectedTrack: undefined
    });
  }

  @SubscribeMessage('join_room')
  async handleJoinRoom(client: Socket, payload: RoomUserPayload) {
    const roomCode = payload.roomCode;
    
    if (!this.roomData.has(roomCode)) {
      client.emit('room_error', { message: 'Room not found' });
      return;
    }

    const room = this.roomData.get(roomCode);
    if (!room) return;
    
    if (room.players.find(p => p.id === client.id)) {
      console.log(`Player ${client.id} already in room ${roomCode}`);
      return;
    }

    client.join(roomCode);

    const joinedUser = await this.usersService.findOne(payload.username);

    room.players.push({ 
      id: client.id, 
      isHost: false, 
      username: payload.username,
      icon: joinedUser?.icon || 'Mario.png',
      character: { id: '', name: '' },
      points: 0,
      isReady: false
    });
    this.playerRoomMap.set(client.id, roomCode);
    
    console.log(`Player ${client.id} joined room ${roomCode} (${room.roomId})`);

    this.server.to(roomCode).emit('room_state', {
      roomCode: room.roomCode,
      roomId: room.roomId,
      hostId: room.hostId,
      players: room.players,
      gameState: room.gameState,
      selectedTrack: room.selectedTrack
    });
  }

  // When the host leaves the room, the room is closed for everyone and all data is cleaned up.
  @SubscribeMessage('leave_room')
  handleLeaveRoom(client: Socket, payload: RoomCodePayload) {
    const roomCode = payload.roomCode;
    if (!roomCode) return;

    this.playerRoomMap.delete(client.id);

    if (this.roomData.has(roomCode)) {
      const room = this.roomData.get(roomCode);
      if (!room) return;
      
      if (room.hostId === client.id) {
        // L'HOST ha abbandonato: Chiudiamo la stanza per tutti
        console.log(`Host left voluntarily. Closing room ${roomCode} (${room.roomId})`);
        
        this.server.to(roomCode).emit('room_closed', { message: 'The host has closed the room.' });
        
        (room.bots || []).forEach(bot => this.gameService.removePlayer(bot.id));
        room.players.forEach(p => this.playerRoomMap.delete(p.id));
        this.roomIdToCode.delete(room.roomId);
        this.roomData.delete(roomCode);
        
        this.server.socketsLeave(roomCode);
      } else {
        // Un GIOCATORE NORMALE ha abbandonato
        room.players = room.players.filter(p => p.id !== client.id);
        
        // Rimuove il client dal canale broadcast della stanza
        client.leave(roomCode);

        if (room.players.length === 0) {
          (room.bots || []).forEach(bot => this.gameService.removePlayer(bot.id));
          this.roomIdToCode.delete(room.roomId);
          this.roomData.delete(roomCode);
          console.log(`Room ${roomCode} (${room.roomId}) deleted`);
        } else {
          this.server.to(roomCode).emit('room_state', {
            roomCode: room.roomCode,
            roomId: room.roomId,
            hostId: room.hostId,
            players: room.players,
            gameState: room.gameState,
            selectedTrack: room.selectedTrack
          });
        }
      }
    }
  }

  @SubscribeMessage('select_track')
  handleSelectTrack(client: Socket, payload: { roomCode: string, track: Track }) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;
    
    if (room.hostId !== client.id) {
      console.log(`Non-host ${client.id} tried to select track`);
      return;
    }

    console.log(`Host ${client.id} selected track for room ${roomCode}:`, payload.track.name);
    room.selectedTrack = payload.track;

    console.log(`Track selection for room ${roomCode} is now:`, room.selectedTrack?.name);
    
    this.server.to(roomCode).emit('track_selected', {
      roomCode: room.roomCode,
      track: payload.track
    });
  }

  @SubscribeMessage('toggle_ready')
  handleToggleReady(client: Socket, payload: { roomCode: string; newReadyState: boolean }) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;

    const player = room.players.find(p => p.id === client.id);
    if (!player) return;

    player.isReady = payload.newReadyState;
    console.log(`Player ${client.id} toggled ready to ${payload.newReadyState} in room ${roomCode}`);

    // Broadcast aggiornamento stanza a tutti i giocatori
    this.server.to(roomCode).emit('room_state', {
      roomCode: room.roomCode,
      roomId: room.roomId,
      hostId: room.hostId,
      players: room.players,
      gameState: room.gameState,
      selectedTrack: room.selectedTrack
    });
  }

  @SubscribeMessage('start_game')
  handleStartGame(client: Socket, payload: RoomCodePayload) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;
    
    if (room.hostId !== client.id) {
      console.log(`Non-host ${client.id} tried to start game`);
      return;
    }

    console.log(`Host ${client.id} starting game for room ${roomCode}`);
    room.gameState = 'RACING';
    
    this.server.to(roomCode).emit('game_started', {
      roomCode: roomCode,
      roomId: room.roomId
    });
  }

  @SubscribeMessage('waiting_for_track')
  handleWaitingForTrack(client: Socket, payload: RoomCodePayload) {
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
  handleStartRace(client: Socket, payload: StartRacePayload) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;
    
    if (room.hostId !== client.id) {
      console.log(`Non-host ${client.id} tried to start race`);
      return;
    }

    console.log(`Host ${client.id} starting race in room ${roomCode} with ${payload.bots.length} bots`);
    
    room.bots = payload.bots;
    room.gameState = 'INTRO';
    this.scoringAppliedRooms.delete(roomCode);

    this.server.to(roomCode).emit('race_start', {
      roomCode: roomCode,
      bots: payload.bots,
      gameState: 'INTRO'
    });

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
  handleSyncGameState(client: Socket, payload: SyncGameStatePayload) {
    const roomCode = payload.roomCode;
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;
    
    if (room.hostId !== client.id) return;

    room.gameState = payload.gameState;
    
    this.server.to(roomCode).emit('game_state_sync', {
      roomCode: roomCode,
      gameState: payload.gameState,
      countdown: payload.countdown
    });
  }

  @SubscribeMessage('race_finished')
  handleRaceFinished(client: Socket, payload: { finishers: any[], racersData: any }) {
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;

    if (room.hostId !== client.id) {
      console.log(`Ignoring race_finished from non-host ${client.id} in room ${roomCode}`);
      return;
    }

    const finisherIds = new Set(
      (payload.finishers || [])
        .map((finisher: { id?: string }) => finisher?.id)
        .filter((id): id is string => Boolean(id))
    );

    const allPlayersFinished = room.players.every((player) => finisherIds.has(player.id));
    if (!allPlayersFinished) {
      console.log(`Ignoring race_finished in room ${roomCode}: not all lobby players finished yet`);
      return;
    }

    if (this.scoringAppliedRooms.has(roomCode)) {
      console.log(`Ignoring duplicate race_finished in room ${roomCode}`);
      return;
    }

    const racersArray = Object.values(payload.racersData || {}) as Array<{ id: string; position?: number }>;
    if (racersArray.length === 0) return;

    this.scoringAppliedRooms.add(roomCode);
    racersArray.sort((a, b) => (a.position ?? 99) - (b.position ?? 99));
    
    const pointsTable = [15, 12, 10, 8, 7, 6, 5, 4, 3, 2, 1, 0];
    
    racersArray.forEach((racer, index) => {
      const earnedPoints = pointsTable[index] || 0;
      const roomPlayer = room.players.find(p => p.id === racer.id);
      if (roomPlayer) {
        roomPlayer.points = (roomPlayer.points || 0) + earnedPoints;
      }
    });

    this.server.to(roomCode).emit('room_state', {
      roomCode: room.roomCode,
      roomId: room.roomId,
      hostId: room.hostId,
      players: room.players,
      gameState: room.gameState,
      selectedTrack: room.selectedTrack
    });

  }

  @SubscribeMessage('return_to_waiting')
  handleReturnToWaiting(client: Socket) {
    const roomCode = this.playerRoomMap.get(client.id);
    if (!roomCode || !this.roomData.has(roomCode)) return;

    const room = this.roomData.get(roomCode);
    if (!room) return;

    if (room.hostId !== client.id) {
      return;
    }

    room.gameState = 'LOBBY';

    this.server.to(roomCode).emit('return_to_waiting', {
      roomCode,
      roomId: room.roomId
    });
  }

@SubscribeMessage('invite_friend_to_room')
  async handleInviteFriendToRoom(client: Socket, payload: { senderName: string, roomCode: string, friendUsername: string }) {
    try {
      const { roomCode, friendUsername, senderName } = payload;

      if (!roomCode || !this.roomData.has(roomCode)) {
        return { success: false, error: 'Room not found or code missing.' };
      }
      
      const room = this.roomData.get(roomCode);
      if (!room) {
        return { success: false, error: 'Room data not found.' };
      }

      const friend = await this.usersService.findOne(friendUsername);
      if (!friend) {
        return { success: false, error: `User ${friendUsername} not found.` };
      }

      const isAlreadyInRoom = room.players.some(p => p.id === friend.socketId);
      if (isAlreadyInRoom) {
        console.log(`Player ${friendUsername} già nella room ${roomCode}`);
        return { success: false, error: `${friendUsername} is already in the room.` };
      }

      const isAlreadyInvited = await this.notificationsService.findNotification(senderName, roomCode, friendUsername);
      if (isAlreadyInvited) {
        console.log(`Player ${friendUsername} already invited to room ${roomCode}`);
        return { success: false, error: `${friendUsername} has already been invited.` };
      }

      await this.notificationsService.createRoomInvite(senderName, roomCode, friendUsername);

      return { 
        success: true, 
        message: `Invite sent successfully to ${friendUsername}!` 
      };

    } catch (error) {
      console.error(`[invite_friend_to_room] Critical error:`, error);
      return { 
        success: false, 
        error: 'An internal error occurred while sending the invite.' 
      };
    }
  }
}