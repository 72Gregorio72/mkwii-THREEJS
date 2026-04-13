import { Controller, Get, Query, NotFoundException, Patch, Body, Post, Delete, ConflictException } from '@nestjs/common';
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

    @Patch('updateIcon')
    async updateIcon(@Query('userName') userName: string, @Body() body: { icon: string }) {
        return await this.userService.updateIcon(userName, body.icon);
    }

	@Patch('updateWins')
	async updateWins(@Query('userName') userName: string, @Body() body: { onlyOffline: boolean }) {
		return await this.userService.updateWins(userName, body.onlyOffline);
	}

    @Patch('updateusername')
	async updateusername(@Query('userName') userName: string, @Body() body: { newUsername: string }) {
        const existingUser = await this.userService.findOne(body.newUsername);
        if (existingUser) {
            throw new ConflictException('Username già in uso');
        }
        try {
		    const updatedUser = await this.userService.updateusername(userName, body.newUsername);
            const payload = { username: updatedUser.username, sub: updatedUser.id };
            const newToken = this.jwtService.sign(payload);

            return {
                user: updatedUser,  
                token: newToken
            };
        } catch (e: any) {
                throw new ConflictException('User not found');
        }
	}

    @Post('updateRecordTime')
    async updateRecordTime(@Query('userName') userName: string, @Body() body: { trackname: string, time: number }) {
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

    @Delete('deleteUser')
    async deleteUser(@Query('userName') userName: string) {
        return await this.userService.deleteUser(userName);
    }

    @Get('getGrandPrixRanking')
    async getGrandPrixRanking(@Query('userName') userName: string) {
        return await this.userService.getGrandPrixRanking(userName);
    }

    @Post('updateRankingGrandPrix')
    async updateRankingGrandPrix(@Query('userName') userName: string, @Body() body: { grandPrixName: string, ranking: number, ccs: number }) {
        return await this.userService.updateRankingGrandPrix(userName, body.grandPrixName, body.ranking, body.ccs);
    }

    @Get('searchUsers')
    async searchUsers(@Query('query') query: string) {
        return await this.userService.searchUsers(query);
    }

    /*@Post('setAllUsersOffline')
    async setAllUsersOffline() {
        console.log('Setting all users offline...');
        return await this.userService.setAllUsersOffline(); 
    }*/

}