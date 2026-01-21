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

@WebSocketGateway({
  cors: { origin: '*' } // Allow React frontend to connect
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
    }, 66); 
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
      rotation: 0 // Track rotation too!
    });
  }

  // 3. Handle Disconnections
  handleDisconnect(client: Socket) {
    console.log(`Player left: ${client.id}`);
    this.gameService.removePlayer(client.id);
    
    // Optional: Tell frontend specifically to remove this mesh immediately
    this.server.emit('player_disconnected', client.id); 
  }

  // 4. Receive Position Updates from Clients
  @SubscribeMessage('move_kart')
  handleMove(client: Socket, payload: { x: number, y: number, z: number, rotation: number }) {
    // The client tells us where they are. 
    // Ideally, the server should calculate physics, but for a simple project, 
    // trusting the client position is fine.
    this.gameService.updatePlayer(client.id, payload);
  }
}