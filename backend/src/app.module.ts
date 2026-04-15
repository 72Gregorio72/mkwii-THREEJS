import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { InfoController } from './info/info.controller';
import { InfoService } from './info/info.service';
import { GameModule } from './game/game.module';
import { AuthModule } from './auth/auth.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { UsersModule } from './users/users.module';
import { UsersService } from './users/users.service';
import { HashService } from './hash/hash.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { FriendsModule } from './friends/friends.module';
import { NotificationsModule } from './notifications/notifications.module';
import { NotificationsService } from './notifications/notifications.service';
import { AppInitService } from './appinit.service';

@Module({
  imports: [GameModule, AuthModule, FriendsModule, UsersModule, NotificationsModule,

    ConfigModule.forRoot({
      isGlobal: true, 
    }),

    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' }, // Il token scadrà in 7 giorni
      }),
    }),
  ],
  controllers: [AppController, InfoController, AuthController],
  providers: [AppService, InfoService, AuthService, UsersService, HashService, NotificationsService, AppInitService],
})
export class AppModule {}
