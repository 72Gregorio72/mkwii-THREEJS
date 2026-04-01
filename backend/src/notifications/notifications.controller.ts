import { Controller, Get, Query, NotFoundException, Patch, Body, Post, Delete, ParseIntPipe  } from '@nestjs/common';
import { NotificationsService } from './notifications.service';


@Controller('')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Delete('deleteNotification')
    async deleteNotification(@Query('notificationId', ParseIntPipe) notificationId: number) {
        await this.notificationsService.deleteNotification(notificationId);
    }

    @Get('notifications')
    async getNotificationsForUser(@Query('username') username: string) {
        // console.log(`Fetching notifications for user ${username}`);
        const notifications = await this.notificationsService.getNotificationsForUser(username);
        if (!notifications) {
            throw new NotFoundException(`No notifications found for user ${username}`);
        }
        return notifications;
    }
}