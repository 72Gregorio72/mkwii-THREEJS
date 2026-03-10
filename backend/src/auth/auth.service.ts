import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashService } from 'src/hash/hash.service';



@Injectable()
export class AuthService {
  constructor(public usersService: UsersService, private hashService: HashService) {}

  async validateUser(username: string, pass: string, socketId?: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    
    if (!user) {
      return null;
    }
    const isValid = await this.hashService.comparePassword(pass, user.password);
    
    if (!isValid) {
      return null;
    }

    const updatedUser = await this.usersService.updateLoginStatus(user.username, true);
	if (socketId) {
	  await this.usersService.updateSocketId(user.username, socketId);
	}		
    const { password, ...result } = updatedUser;
    return result;
  }

  async register(user: any) {
    user.password = await this.hashService.hashPassword(user.password);
    return this.usersService.addUser(user);
  }

  async checkLoginStatus(username: string) {
    const user = await this.usersService.findOne(username);
    if (!user) {
      return { isLoggedIn: false };
    }
    return { isLoggedIn: user.isLoggedIn };
  }
}