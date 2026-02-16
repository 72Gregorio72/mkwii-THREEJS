import { Controller, Post, Body, Get, ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async createUser(@Body() body: any) { // Aggiungi async
        return await this.authService.register(body); // Aggiungi await
    }

    @Post('login')
    async loginUser(@Body() body: any) {
        const result = await this.authService.validateUser(body.username, body.password);
        if (!result)
            throw new ConflictException('Wrong password or email');
        return result;
    }
}