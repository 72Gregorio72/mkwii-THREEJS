import { Controller, Get, Query, Patch, Body, Post, Delete, ParseIntPipe } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { UsersService } from 'src/users/users.service';


@Controller('')
export class FriendsController {

    constructor(private readonly friendsService: FriendsService, private readonly userService: UsersService) {}


    @Get('getFriendList')
    async getFriendList(@Query('username') username: string) {
        return this.friendsService.getFriends(username);
    }

    @Get('getPendingRequests')
    async getPendingRequests(@Query('username') username: string) {
        return this.friendsService.getPendingRequests(username);
    }

    @Post('sendFriendRequest')
    async sendFriendRequest(@Query('username') username: string, @Body('receiverName') receiverName: string) {
        const receiverUser = await this.userService.findOne(receiverName);
        if (!receiverUser) {
            return { success: false, message: 'User not found' };
        }

        try {
            await this.friendsService.sendRequest(username, receiverName);
            return { success: true, message: 'Request Sent!' };
        } catch (error: any) {
            const response = error?.response;
            const message =
                typeof response?.message === 'string'
                    ? response.message
                    : Array.isArray(response?.message)
                        ? response.message[0]
                        : 'Error sending request';

            return { success: false, message };
        }
    }

    // ParseIntPipe converte automaticamente da stringa della query a number
    @Delete('rejectRequest')
    async rejectRequest(@Query('requestId', ParseIntPipe) requestId: number) {
        return this.friendsService.rejectRequest(requestId);
    }

    @Patch('acceptRequest')
    async acceptRequest(@Query('requestId', ParseIntPipe) requestId: number) {
        return this.friendsService.acceptRequest(requestId);
    }

    @Delete('deleteFriend')
    async deleteFriend(@Query('username') username: string, @Query('friendToDelete') friendToDelete: string) {
        return this.friendsService.deleteFriend(username, friendToDelete);
    }
}