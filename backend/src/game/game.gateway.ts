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
    origin: ['https://localhost', 'https://127.0.0.1', `https://${myIP}`],
    credentials: true,
  },
  transports: ['websocket', 'polling']
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  private items = new Map<string, any>();

	// In your heartbeat (afterInit), include items in the world update
	// or send a separate 'items_update'
	afterInit() {
		setInterval(() => {
			const players = this.gameService.getWorldState().players;
			
			this.server.emit('world_update', { players }); 
		}, 1000 / 60);
	}

  // 2. Handle New Connections
  handleConnection(client: Socket) {
    console.log(`Player connected: ${client.id}`);
    
    // Create the player in the service with a default starting position
    // You might want to randomize x/z slightly so they don't stack on top of each other
    this.gameService.updatePlayer(client.id, { 
      id: client.id, 
      x: 0, 
      y: 0, 
      z: 0,
      rotation: { x: 0, y: 0, z: 0, w: 1 } // Track rotation too!
    });
  }

  // 3. Handle Disconnections
  handleDisconnect(client: Socket) {
    console.log(`Player left: ${client.id}`);
    this.gameService.removePlayer(client.id);
    
    // Optional: Tell frontend specifically to remove this mesh immediately
    //this.server.emit('player_disconnected', client.id); 
  }

  // 4. Receive Position Updates from Clients
	@SubscribeMessage('move_kart')
	handleMove(client: Socket, payload: { 
		x: number, 
		y: number, 
		z: number, 
		rotation: any, 
		steer: number, 
		drift: number,
		effects: {
			isBulletBill: boolean, 
			isStar: boolean, 
			isMega: boolean, 
			isSmall: boolean,
			isSpinning: boolean
		},
	}) {
		this.gameService.updatePlayer(client.id, payload);
	}
  // to set the vehicle and the racer of the opponents
  @SubscribeMessage('set_details')
  handleSetDetails(client: Socket, payload: { charId: string, vehicleId: string }) {
    console.log(`Player ${client.id} selected: ${payload.charId} / ${payload.vehicleId}`);
    
    // Save these IDs into the player's state
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