import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { HashService } from 'src/hash/hash.service';



@Injectable()
export class AuthService {
  constructor(public usersService: UsersService, private hashService: HashService, private jwtService: JwtService) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(username);
    
    if (!user) {
      return null;
    }

    const isValid = await this.hashService.comparePassword(pass, user.password);
    if (!isValid) {
      return null;
    }

    const { password, ...result } = user;
    return result; 
  }

  async login(user: any) {
    // Il payload conterrà l'ID utente (sub) e lo username
    const payload = { username: user.username, sub: user.id };
    
    // Generiamo il JWT
    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      username: user.username,
      token: token,
    };
  }

  async register(user: any) {
    user.password = await this.hashService.hashPassword(user.password);
    const newUser = await this.usersService.addUser(user);
    return this.login(newUser);
  }

  async checkLoginStatus(username: string) {
    const user = await this.usersService.findOne(username);
    if (!user) {
      return { isLoggedIn: false };
    }
    return { isLoggedIn: user.isLoggedIn };
  }
}