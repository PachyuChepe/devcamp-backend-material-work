// src/auth/strategies/jwt.strategy.ts
import { Injectable } from '@nestjs/common'; // NestJS에서 클래스를 서비스로 등록할 때 사용하는 데코레이터
import { PassportStrategy } from '@nestjs/passport'; // NestJS의 Passport를 위한 기본 전략 클래스
import { ExtractJwt, Strategy } from 'passport-jwt'; // JWT를 추출하고 처리하는 데 필요한 함수 및 Strategy 클래스
import { UserService } from '../services';
import { ConfigService } from '@nestjs/config';
import { TokenPayload } from '../types';
import { User } from '../entities';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  // JwtStrategy 클래스 생성자
  constructor(
    private readonly userService: UserService, // UserService 주입
    private readonly configService: ConfigService, // ConfigService 주입
  ) {
    // PassportStrategy를 상속받은 JwtStrategy의 설정
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // 요청에서 JWT를 추출하는 방법 설정: Authorization 헤더에서 Bearer 토큰으로
      ignoreExpiration: false, // 토큰의 만료를 검사하도록 설정
      secretOrKey: configService.get<string>('JWT_SECRET'), // JWT를 검증할 때 사용할 비밀키 설정
    });
  }

  // validate 메소드: Passport가 JWT 검증 후 실행
  async validate(payload: TokenPayload): Promise<User> {
    const { sub, jti } = payload; // payload에서 사용자 ID와 JWT ID를 추출
    return this.userService.validateUser(sub, jti); // UserService를 사용하여 사용자와 JWT의 유효성을 검증
  }
}
