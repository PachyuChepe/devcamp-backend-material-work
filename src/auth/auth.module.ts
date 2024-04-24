import { Module } from '@nestjs/common';
import { User } from './entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './repositories';
import { UserService } from './services';
import { AuthController } from './controllers';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule, ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [AuthController],
  providers: [UserService, UserRepository],
  exports: [UserService, UserRepository],
})
export class AuthModule {}
