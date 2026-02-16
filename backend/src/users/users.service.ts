import { Injectable, ConflictException } from '@nestjs/common';

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

  async findOne(username: string): Promise<User | undefined> {
    return this.users.find(user => user.username.toLowerCase() === username.toLowerCase());
  }

  async addUser(data: any): Promise<User> {
    // Verifica se esiste già
    const existingUser = await this.findOne(data.username);
    
    if (existingUser) {
        throw new ConflictException('User already exists');
    }

    const newUser = {
        userId: this.users.length + 1,
        username: data.username,
        password: data.password, 
        email: data.email 
    };

    this.users.push(newUser);
    console.log("Utenti attuali:", this.users);
    return newUser;
  }
}