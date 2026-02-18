import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { HashService } from 'src/hash/hash.service';


@Injectable()
export class AuthService {
  constructor(private usersService: UsersService, private hashService: HashService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    if (!user) {
      return null;
    }
    const validate = await this.hashService.comparePassword(pass, user.password);
    if (validate) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async register(user: any) {
    user.password = await this.hashService.hashPassword(user.password);
    return this.usersService.addUser(user);
  }
}