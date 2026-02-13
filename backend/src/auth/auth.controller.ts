import { AuthService } from './auth.service';
import { Controller, Post, Body } from '@nestjs/common';

@Controller('')
export class AuthController {
    constructor(private readonly authService : AuthService) {}

    @Post('register')
    createUser(@Body() body: {
        email: string,
        name: string,
        password: string
    }) {
        console.log("email: ", body.email);
        console.log("name: ", body.name);
        console.log("password: ", body.password);

        return `Name: ${body.name}`;
    }
}