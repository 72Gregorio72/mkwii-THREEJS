import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class FriendsService {
  private prisma = new PrismaClient();

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }
  
  // 1. Inviare una richiesta di amicizia
  async sendRequest(senderName: string, receiverName: string) {
    if (senderName === receiverName) {
      throw new BadRequestException("Non puoi inviare una richiesta a te stesso!");
    }

    // Controlla se esiste già una richiesta
    const existingRequest = await this.prisma.friendRequest.findUnique({
      where: {
        senderName_receiverName: {
          senderName,
          receiverName,
        },
      },
    });

    if (existingRequest) {
      throw new BadRequestException("Richiesta già inviata in precedenza.");
    }

    return this.prisma.friendRequest.create({
      data: {
        senderName,
        receiverName,
        status: 'PENDING',
      },
    });
  }

  // 2. Accettare una richiesta (Transazione)
  async acceptRequest(requestId: number) {
    const request = await this.prisma.friendRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException("Richiesta di amicizia non trovata");
    }

    // Creiamo l'amicizia ed eliminiamo la richiesta in un'unica transazione sicura
    return this.prisma.$transaction([
      this.prisma.friendship.create({
        data: {
          userName: request.senderName,
          friendName: request.receiverName,
        },
      }),
      this.prisma.friendRequest.delete({
        where: { id: requestId },
      }),
    ]);
  }

  // 3. Rifiutare/Annullare una richiesta
  async rejectRequest(requestId: number) {
    return this.prisma.friendRequest.delete({
      where: { id: requestId },
    });
  }

async deleteFriend(userName: string, friendToDelete: string) {
    return this.prisma.friendship.deleteMany({
        where: {
            OR: [
                { userName: userName, friendName: friendToDelete },
                { userName: friendToDelete, friendName: userName }
            ]
        }
    });
}

  // 4. Ottenere la lista amici di un utente
  async getFriends(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: {
        friendsInitiated: { include: { friend: true } },
        friendsReceived: { include: { user: true } },
      },
    });

    if (!user) throw new NotFoundException("Utente non trovato");

    // Uniamo chi ho aggiunto e chi mi ha aggiunto, scartando i dati della tabella ponte
    const initiated = user.friendsInitiated.map(f => f.friend);
    const received = user.friendsReceived.map(f => f.user);
    
    return [...initiated, ...received];
  }

  // 5. Ottenere le richieste in sospeso ricevute
  async getPendingRequests(username: string) {
    return this.prisma.friendRequest.findMany({
      where: {
        receiverName: username,
        status: 'PENDING',
      },
      include: {
        sender: true, // Includo i dati di chi ha inviato la richiesta
      }
    });
  }
}