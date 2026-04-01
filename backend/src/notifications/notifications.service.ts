import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';


@Injectable()
export class NotificationsService {
  private prisma = new PrismaClient();
    

    async findNotification(senderName: string, entityId: string, receiverName: string) {
        return await this.prisma.notification.findFirst({
            where: {
                senderName: senderName,
                entityId: entityId,
                receiverName: receiverName,
            },
        });
    }
    // - Creare un nuovo invito alla room
    async createRoomInvite(senderName: string, roomCode: string, friendUsername: string) {
        console.log(`Creating room invite from ${senderName} to ${friendUsername} for room ${roomCode}`);
        await this.prisma.notification.create({
            data: {
                senderName: senderName,
                entityId: roomCode,
                receiverName: friendUsername,
            },
        });
    }

    // - Eliminare una notifica (ad esempio dopo che è stata accettata o rifiutata)
    async deleteNotification(notificationId: number) {
        await this.prisma.notification.delete({
            where: {
                id: notificationId,
            },
        });
    }

    async getNotificationsForUser(username: string) {
        // console.log(`Fetching notifications for user ${username}`);
        return await this.prisma.notification.findMany({
            where: {
                receiverName: username,
                status: 'PENDING',
            },
        });
    }

}