import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt';


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

    const userFound = await prisma.user.findUnique({
      where: {
        username: username.toLowerCase(),
          },
        });
        if (!userFound) {
          return null;
        }
        return userFound;
  }

  async addUser(data: any): Promise<User> {
    const prisma = new PrismaClient()
  
    try {
      const newUser = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email,
          password: data.password,
        },
      })
      return newUser;
    } catch (e: any) {
      if (e.code === 'P2002') {
        throw new ConflictException('Username o Email già in uso');
      }
      return null;
    } finally {
      await prisma.$disconnect()
    }
    // this.users.push(newUser);
    // console.log("Utenti attuali:", this.users);
  }
}