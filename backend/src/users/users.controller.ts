import { Controller, Get, Query, NotFoundException, Patch, Body, Post } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('')
export class UsersController {
    constructor(private readonly userService: UsersService) {}

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

    @Post('updateRecordTime')
    async updateRecordTime(@Query('userName') userName: string, @Body() body: any) {
        return await this.userService.saveBestTime(userName, body.trackname, body.time);
    }

    @Get('getRecordTime')
    async getRecordTime(@Query('userName') userName: string, @Query('trackName') trackName: string) {
        return await this.userService.getBestTime(userName, trackName);
    }
}   