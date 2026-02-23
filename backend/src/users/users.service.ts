import { Injectable, ConflictException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export type User = any;

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

  async addUser(data: any): Promise<User> {
    try {
      const newUser = await this.prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: data.password,
          icon: "Mario.png"
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

  async updateWins(username: string, onlyOffline: boolean): Promise<User> {
	if (onlyOffline) {
		try {
    console.log(`Updating offline wins for user: ${username}`);
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
	}
  }
}