import { Controller, Post, Body, Get, BadRequestException, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, LogoutDto } from './auth.dto';

@Controller('')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    async createUser(@Body() body: RegisterDto) {
        return await this.authService.register(body);
    }

    @Post('login')
    async loginUser(@Body() body: LoginDto) {
        const user = await this.authService.validateUser(body.username, body.password);
        
        if (!user) {
            throw new BadRequestException('Wrong password or username');
        }
        return this.authService.login(user);
    }

    @Get('checklogin')
    async checkLoginStatus(@Query('username') username: string) {
        return await this.authService.checkLoginStatus(username);
    }

    @Post('logout')
    async logoutUser(@Body() body: LogoutDto) {
		console.log(`Logging out user: ${body.username}`);
        return await this.authService.usersService.updateLoginStatus(body.username, false);
    }
}