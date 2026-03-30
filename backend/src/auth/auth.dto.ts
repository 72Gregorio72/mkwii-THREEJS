export class RegisterDto {
  username!: string;
  email!: string;
  password!: string;
  socketId?: string | null;
}

export class LoginDto {
  username!: string;
  password!: string;
  socketId?: string | null;
}

export class LogoutDto {
  username!: string;
}