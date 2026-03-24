import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { UsersModule } from 'src/users/users.module';
import { HashService } from 'src/hash/hash.service';

@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, HashService, UsersService],
})
export class AuthModule {}