import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { HashService } from 'src/hash/hash.service';
import { AuthUser, LoginResponse, ValidatedUser } from 'src/utils_types/types';
import { RegisterDto, LoginDto, LogoutDto } from './auth.dto';


@Injectable()
export class AuthService {
  constructor(public usersService: UsersService, private hashService: HashService, private jwtService: JwtService) {}

  async validateUser(username: string, pass: string): Promise<AuthUser | null> {
    const user = await this.usersService.findOne(username);
    
    if (!user) {
        return null;
      }

    if (!user.password) {
      return null;
    }
    const isValid = await this.hashService.comparePassword(pass, user.password);
    if (!isValid) {
      return null;
    }

    const { password, ...result } = user;
    return result; 
  }

  async login(user: ValidatedUser): Promise<LoginResponse> {
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

  async register(userDto: RegisterDto): Promise<LoginResponse> {
    const hashedPassword = await this.hashService.hashPassword(userDto.password);
    
    const userToCreate = {
      ...userDto,
      password: hashedPassword
    };

    const newUser: AuthUser = await this.usersService.addUser(userToCreate);
    
    // Rimuoviamo la password dal newUser prima di passarlo al login per rispecchiare ValidatedUser
    const { password, ...validatedNewUser } = newUser;
    return this.login(validatedNewUser);
  }

  async checkLoginStatus(username: string) {
    const user = await this.usersService.findOne(username);
    if (!user) {
      return { isLoggedIn: false };
    }
    return { isLoggedIn: user.isLoggedIn };
  }
}