import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'


export type User = any;

@Injectable()
export class UsersService {

  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
      email: 'john@test.com'
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
      email: 'maria@test.com'
    },
  ];

  async findOne(username: string): Promise<User | null> {
    const prisma = new PrismaClient()
      return prisma.user.findFirst({
        where: {
          username: username.toLowerCase()
        },
      });
  }

  async addUser(data: any): Promise<User> {
    const prisma = new PrismaClient()
    // Verifica se esiste già
    const existingUser = await this.findOne(data.username);
    
    if (existingUser) {
        throw new ConflictException('User already exists');
    }

    // const newUser = {
    //     userId: this.users.length + 1,
    //     username: data.username,
    //     password: data.password, 
    //     email: data.email 
    // };
    try {
      const newUser = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: data.password,
        },
      })
      return newUser;
    } catch (e) {
      console.error('Errore durante la creazione:', e)
      return null;
    } finally {
      await prisma.$disconnect()
    }
    // this.users.push(newUser);
    // console.log("Utenti attuali:", this.users);
  }
}