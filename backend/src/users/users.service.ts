import { Injectable, ConflictException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, RecordTimes, GrandPrix } from '@prisma/client';
import { User } from '../utils_types/types';
import { RegisterDto } from 'src/auth/auth.dto';

@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  private prisma = new PrismaClient();

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  async findOne(username: string): Promise<User | null> {
    const userFound = await this.prisma.user.findUnique({
      where: {
        username: username,
      },
    });

    return userFound;
  }

  async updateSocketAndLoginStatus(username: string, socketId: string, status: boolean) {
    return this.prisma.user.updateMany({
      where: { username: username },
      data: { 
        socketId: socketId, 
        isLoggedIn: status 
      },
    });
  }

  async addUser(data: RegisterDto): Promise<User> {
    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: data.password,
          icon: "Mario.png",
          isLoggedIn: true,
		  socketId: data.socketId || null
        },
      });
      return newUser;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Username o Email già in uso');
      }
      throw e;
    }
  }

  async updateIcon(username: string, iconName: string): Promise<User> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: {
          username: username,
        },
        data: {
          icon: iconName,
        },
      });
      return updatedUser;
    } catch (error) {
      throw new ConflictException('Impossibile aggiornare l\'icona. Utente non trovato?');
    }
  }

  async updateusername(username: string, newUsername: string): Promise<User> {
    try {
      const updatedUser = await this.prisma.user.update({
        where: {
          username: username,
        },
        data: {
          username: newUsername,
        },
      });
      return updatedUser;
    } catch (error) {
      throw new ConflictException('Impossibile aggiornare il nome utente. Utente non trovato?');
    }
  }

  async updateWins(username: string, onlyOffline: boolean): Promise<User> {
    if (onlyOffline) {
      try {
      // console.log(`Updating offline wins for user: ${username}`);
      const updatedUser = await this.prisma.user.update({
        where: {
          username: username,
        },
        data: {
          offlineWins: {
            increment: 1,
          },
        }
      });
      return updatedUser;
      } catch (error) {
        throw new ConflictException('Impossibile aggiornare le vittorie. Utente non trovato?');
      }
    } else {
      try {
        // console.log(`Updating offline wins for user: ${username}`);
        const updatedUser = await this.prisma.user.update({
          where: {
            username: username,
          },
          data: {
            onlineWins: {
              increment: 1,
            },
        }
      });
      return updatedUser;
      } catch (error) {
        throw new ConflictException('Impossibile aggiornare le vittorie. Utente non trovato?');
      }
    }
  }

  async getBestTime(userName: string, trackName: string): Promise<RecordTimes | null> {
    const record = await this.prisma.recordTimes.findUnique({
      where: { userName_trackName: { userName, trackName } }
    });
    return record;
  }

  async saveBestTime(userName: string, trackName: string, newTime: number) {
    const existingRecord = await this.getBestTime(userName, trackName);

    if (existingRecord && existingRecord.time <= newTime) {
      return existingRecord;
    }

    return this.prisma.recordTimes.upsert({
      where: { userName_trackName: { userName, trackName } },
      update: { time: newTime },
      create: { userName, trackName, time: newTime },
    });
  }

  async updateLoginStatus(username: string, status: boolean) {
    return this.prisma.user.updateMany({
      where: { username: username },
      data: { isLoggedIn: status },
    });
  }

  async updateLoginStatusBySocketId(socketId: string, status: boolean) {
    return this.prisma.user.updateMany({
      where: { socketId: socketId },
      data: { isLoggedIn: status },
    });
  }
  
  async getUserBySocketId(socketId: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { socketId: socketId },
      });
      return user;
    }catch (error) {
      console.error('Error fetching user by socketId:', error);
      return null;
    }
  }

  async deleteUser(username: string) {
    try {
      await this.prisma.user.delete({
        where: { username: username },
      });
      return { message: 'User deleted successfully' };
    } catch (error) {
      throw new ConflictException('Impossibile eliminare l\'utente. Utente non trovato?');
    }
  }

  async getGrandPrixRanking(username: string): Promise<GrandPrix[]> {
    //console.log(`Fetching Grand Prix ranking for user: ${username}`);
    try {
      const grandPrixRanking = await this.prisma.grandPrix.findMany({
        where: { userName: username },
        orderBy: { createdAt: 'desc' },
      });
      return grandPrixRanking;
    } catch (error) {
      console.error('Error fetching Grand Prix ranking:', error);
      return [];
    }
  }

async updateRankingGrandPrix(username: string, grandPrixName: string, ranking: number, ccs: number): Promise<GrandPrix> {
    try {
      // 1. Cerca se il record esiste già per QUELLA specifica cilindrata (ccs)
      const existingGrandPrix = await this.prisma.grandPrix.findUnique({
        where: { 
          // Prisma crea in automatico questo nome basato sul @@unique
          userName_grandPrixName_ccs: { 
            userName: username, 
            grandPrixName: grandPrixName,
            ccs: ccs 
          } 
        },
      });

      // 2. Se non esiste, lo crea
      if (!existingGrandPrix) {
        return await this.prisma.grandPrix.create({
          data: { userName: username, grandPrixName, ranking, ccs },
        });
      }

      // 3. Se esiste (per questa specifica coppa e cilindrata), aggiorna SOLO se il ranking è migliore (es. 1 è meglio di 3)
      if (ranking < existingGrandPrix.ranking) {
        return await this.prisma.grandPrix.update({
          where: { 
            userName_grandPrixName_ccs: { 
              userName: username, 
              grandPrixName: grandPrixName,
              ccs: ccs
            } 
          },
          // Aggiorniamo solo il ranking. Non serve aggiornare i ccs perché sono già uguali (li abbiamo usati nel where)
          data: { ranking }, 
        });
      }

      // 4. Se il nuovo ranking è peggiore o uguale, non fare nulla e restituisci il record esistente
      return existingGrandPrix;

    } catch (error) {
      console.error('Error updating Grand Prix ranking:', error); 
      throw new ConflictException('Impossibile aggiornare il ranking del Gran Prix. Utente non trovato?');
    }
  }

  async searchUsers(query: string): Promise<{ username: string; icon: string; isLoggedIn: boolean }[]> {
    try {
      const users = await this.prisma.user.findMany({
        where: {
          username: {
            contains: query,
            mode: 'insensitive',
          },
        },
        select: {
          username: true,
          icon: true,
          isLoggedIn: true,
        },
      });
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  async setAllUsersOffline() {
    try {
      await this.prisma.user.updateMany({
        data: { isLoggedIn: false },
        where: { isLoggedIn: true },
      });
    } catch (error) {
      console.error('Error setting all users offline:', error);
    }
  }
}