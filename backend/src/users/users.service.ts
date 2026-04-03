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

  async searchUsers(query: string): Promise<Partial<User>[]> {
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
        take: 10, // Limit to 10 results
      });
      return users;
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
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

  async updateRankingGrandPrix(username: string, grandPrixName: string, ranking: number): Promise<GrandPrix> {
    try {
      const updatedGrandPrix = await this.prisma.grandPrix.upsert({
        where: { userName_grandPrixName: { userName: username, grandPrixName } },
        update: { ranking },
        create: { userName: username, grandPrixName, ranking },
      });
      return updatedGrandPrix;
    } catch (error) {
      console.error('Error updating Grand Prix ranking:', error); // LOG: vedi il vero errore
      throw new ConflictException('Impossibile aggiornare il ranking del Gran Prix. Utente non trovato?');
    }
  }
}