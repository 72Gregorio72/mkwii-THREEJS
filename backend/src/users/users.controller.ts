import { Controller, Get, Query, NotFoundException, Patch, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtService } from '@nestjs/jwt';
@Controller('')
export class UsersController {
    constructor(private readonly userService: UsersService, private readonly jwtService: JwtService) {}

    @Get('profile')
    async getUser(@Query('userName') userName: string) {
        const user = await this.userService.findOne(userName.trim());
        if (!user) {
            throw new NotFoundException('User not found');
        }
        const { password, ...result } = user; // remove password from the user
        
        return result; 
    }

    @Patch('profile')
    async updateIcon(@Query('userName') userName: string, @Body() body: any) {
        return await this.userService.updateIcon(userName, body.icon);
    }

	@Patch('updateWins')
	async updateWins(@Query('userName') userName: string, @Body() body: any) {
		return await this.userService.updateWins(userName, body.onlyOffline);
	}

    @Patch('updateusername')
	async updateusername(@Query('userName') userName: string, @Body() body: any) {
		const updatedUser = await this.userService.updateusername(userName, body.newUsername);
        
        const payload = { username: updatedUser.username, sub: updatedUser.id };
        const newToken = this.jwtService.sign(payload);

        return {
            user: updatedUser,
            token: newToken
        };
	}

    @Post('updateRecordTime')
    async updateRecordTime(@Query('userName') userName: string, @Body() body: any) {
        return await this.userService.saveBestTime(userName, body.trackname, body.time);
    }

    @Get('getRecordTime')
    async getRecordTime(@Query('userName') userName: string, @Query('trackName') trackName: string) {
        return await this.userService.getBestTime(userName, trackName);
    }

	@Get('getIsLoggedIn')
	async getIsLoggedIn(@Query('socketId') socketId: string) {
		return await this.userService.getUserBySocketId(socketId);
	}
}   