// src/auth/controllers/auth.controller.ts
import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from '../services';
import { CreateUserDto, SignupResDto } from '../dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly userService: UserService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto): Promise<SignupResDto> {
    const user = await this.userService.createUser(createUserDto);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }
}
