// backend/src/game/game.gateway.ts
import { 
  SubscribeMessage, 
  WebSocketGateway, 
  WebSocketServer, 
  OnGatewayConnection, 
  OnGatewayDisconnect,
  OnGatewayInit // Import this
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({ 
  cors: { origin: '*' } 
}) 
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  // 1. Start the Game Loop when the Gateway starts
  // afterInit() {
  //   setInterval(() => {
  //     // Get all players from service
  //     const snapshot = this.gameService.getWorldState();
      
  //     // Emit to EVERYONE connected
  //     // The frontend expects 'world_update' based on your previous React code
  //     this.server.emit('world_update', snapshot); 
  //   }, 20); // 50ms = 20 updates per second (good for simple racing)
  // }

  handleConnection(client: Socket) {
    console.log('New player connected:', client.id);
    // Initialize player in service
    //this.gameService.updatePlayer(client.id, { x:0, y:0, z:0 });
  }

  handleDisconnect(client: Socket) { 
    console.log('Player left:', client.id);
    // Remove player so they disappear from the screen
    this.gameService.removePlayer(client.id);
  }

  @SubscribeMessage('move_kart')
  handleMove(client: Socket, payload: any) {
    // Just update the memory, the Loop above will handle the broadcasting
    this.gameService.updatePlayer(client.id, payload);
  }
}