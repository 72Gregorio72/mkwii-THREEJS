import { Controller, Post, Body, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async createUser(@Body() body: any) { // Aggiungi async
        return await this.authService.register(body); // Aggiungi await
    }
}