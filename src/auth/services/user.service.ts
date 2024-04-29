// src/auth/services/user.service.ts
import { AccessTokenRepository, UserRepository } from '../repositories';
import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as argon2 from 'argon2';
import { User } from '../entities';
import { CreateUserDto } from '../dto';
import { BusinessException } from '../../exception';

@Injectable()
export class UserService {
  // 로그를 기록할 Logger 객체를 초기화
  private readonly logger = new Logger(UserService.name);

  // UserRepository와 AccessTokenRepository 객체를 주입받아 초기화
  constructor(
    private readonly userRepo: UserRepository,
    private readonly accessTokenRepo: AccessTokenRepository,
  ) {}

  // 새 사용자를 생성하는 비동기 함수
  async createUser(dto: CreateUserDto): Promise<User> {
    // 주어진 이메일로 사용자를 검색
    const user = await this.userRepo.findOneByEmail(dto.email);
    // 이미 같은 이메일을 가진 사용자가 있다면 예외를 발생
    if (user) {
      throw new BusinessException(
        'user',
        `${dto.email} already exist`,
        `${dto.email} already exist`,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 사용자의 비밀번호를 argon2로 해싱
    const hashedPassword = await argon2.hash(dto.password);
    // 사용자를 생성하고 생성된 사용자 객체를 반환
    return this.userRepo.createUser(dto, hashedPassword);
  }

  // 사용자 ID와 JWT ID로 사용자와 토큰의 유효성을 검증하는 비동기 함수
  async validateUser(id: string, jti: string): Promise<User> {
    // 사용자 정보와 토큰 정보를 동시에 조회
    const [user, token] = await Promise.all([
      this.userRepo.findOneBy({ id }),
      this.accessTokenRepo.findOneByJti(jti),
    ]);
    // 사용자가 존재하지 않는 경우 로그를 기록하고 예외를 발생
    if (!user) {
      this.logger.error(`user ${id} not found`);
      throw new BusinessException(
        'user',
        `user not found`,
        `user not found`,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 토큰이 존재하지 않는 경우 로그를 기록하고 예외를 발생
    if (!token) {
      this.logger.error(`jti ${jti} token is revoked`);
      throw new BusinessException(
        'user',
        `revoked token`,
        `revoked token`,
        HttpStatus.BAD_REQUEST,
      );
    }
    // 사용자 객체를 반환
    return user;
  }
}
