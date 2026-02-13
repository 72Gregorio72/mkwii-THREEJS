import { Injectable, ConflictException } from '@nestjs/common';

export type User = any;

@Injectable()
export class UsersService {
  private readonly users = [
    {
      userId: 1,
      username: 'john',
      password: 'changeme',
    },
    {
      userId: 2,
      username: 'maria',
      password: 'guess',
    },
  ];

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username === username);
  }

  // Ora è async perché deve aspettare findOne
  async addUser(data: any): Promise<User> {
    // IMPORTANTE: Dobbiamo usare 'await', altrimenti l'if è sempre vero (oggetto Promise)
    const existingUser = await this.findOne(data.username);
    
    if (existingUser) {
        // Lancia un 409 Conflict automaticamente gestito da NestJS
        throw new ConflictException('User already exists');
    }

    const newUser = {
        userId: this.users.length + 1,
        username: data.username,
        password: data.password, 
        email: data.email 
    };

    this.users.push(newUser);
    return newUser;
  }
}