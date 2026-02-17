import { Controller, Get, Query, NotFoundException } from '@nestjs/common';
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
}