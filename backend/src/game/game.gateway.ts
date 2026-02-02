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

  afterInit() {
    setInterval(() => {
      const players = this.gameService.getWorldState().players;
      this.server.emit('world_update', { players }); 
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
  }

  handleDisconnect(client: Socket) {
    console.log(`Player left: ${client.id}`);
    this.gameService.removePlayer(client.id);
  }

  @SubscribeMessage('move_kart')
  handleMove(client: Socket, payload: any) {
    this.gameService.updatePlayer(client.id, payload);
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
}