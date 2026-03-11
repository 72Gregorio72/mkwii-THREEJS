import { Controller, Post, Body, Get, UnauthorizedException, Query } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async createUser(@Body() body: any) {
        return await this.authService.register(body);
    }

    @Post('login')
    async loginUser(@Body() body: any) {
        const user = await this.authService.validateUser(body.username, body.password);
        
        if (!user) {
            throw new UnauthorizedException('Wrong password or username');
        }
        return this.authService.login(user);
    }

    @Get('checklogin')
    async checkLoginStatus(@Query('username') username: string) {
        return await this.authService.checkLoginStatus(username);
    }

    @Post('logout')
    async logoutUser(@Body() body: any) {
		console.log(`Logging out user: ${body.username}`);
        return await this.authService.usersService.updateLoginStatus(body.username, false);
    }
}