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
    // 1. STRICT ORIGIN: You MUST list the exact frontend URL.
    // Wildcards ('*') are forbidden when credentials are true.
    origin: ['https://localhost:3000', 'https://localhost:5173'], 
    
    // 2. CREDENTIALS: Required for cookies/sticky sessions
    credentials: true, 
  },
  // 3. TRANSPORTS: 'polling' is useful as a fallback if WS fails initially,
  // but strictly 'websocket' is fine if the client is configured to match.
  transports: ['websocket', 'polling'] 
})
export class GameGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  // 1. The Heartbeat: This runs automatically when the Gateway starts
  afterInit() {
    // Run the loop at ~30 FPS (1000ms / 30 = ~33ms)
    setInterval(() => {
      // Get the current state of all players (positions, rotations)
      const gameState = this.gameService.getWorldState();

      // Emit 'world_update' to EVERYONE connected
      // The frontend will listen for this event to render opponent karts
      this.server.emit('world_update', gameState);
    }, 33); 
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

    // Broadcast this event to EVERYONE (including the victim).
    this.server.emit('banana-hit', { 
      attackerId: client.id,
      victimId: payload.victimId,
      type: payload.type 
    });
  }

  @SubscribeMessage('use_lightning')
	handleLightning(client: Socket, payload: { attackerId: string }) {
	// Invia a TUTTI, incluso chi ha usato l'item
	this.server.emit('lightning-strike', { 
		attackerId: payload.attackerId // Fondamentale per filtrare
	});
	}

	@SubscribeMessage('spawn_item')
	handleSpawnItem(client: Socket, payload: any) {
		const itemId = `item_${Date.now()}_${client.id}`;
		const newItem = {
			id: itemId,
			ownerId: client.id,
			type: payload.type,
			position: payload.position, // [x, y, z]
			velocity: payload.velocity, // [vx, vy, vz]
			timestamp: Date.now(),
		};
		this.items.set(itemId, newItem);
		this.server.emit('item_spawned', newItem);
	}

	@SubscribeMessage('remove_item')
	handleRemoveItem(client: Socket, payload: { itemId: string }) {
		if (this.items.has(payload.itemId)) {
			this.items.delete(payload.itemId);
			this.server.emit('item_removed', { itemId: payload.itemId });
		}
	}
}