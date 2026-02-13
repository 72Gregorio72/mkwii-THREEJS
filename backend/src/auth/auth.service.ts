import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service'; // Assicurati che il percorso sia corretto

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(user: any) {
    return this.usersService.addUser(user);
  }
}