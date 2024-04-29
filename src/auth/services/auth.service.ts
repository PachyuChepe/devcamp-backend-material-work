// src/auth/services/auth.service.ts
import { HttpStatus, Injectable } from '@nestjs/common'; // NestJS의 데코레이터 및 HTTP 상태 코드
import * as argon2 from 'argon2'; // 비밀번호 해싱을 위한 argon2 라이브러리 가져오기
import {
  AccessLogRepository,
  AccessTokenRepository,
  RefreshTokenRepository,
  UserRepository,
} from '../repositories'; // 사용자 및 토큰 관련 데이터베이스 작업을 위한 저장소
import { User } from '../entities'; // 데이터베이스에 있는 사용자를 대표하는 사용자 엔티티
import { BusinessException } from '../../exception'; // 비즈니스 규칙 위반을 처리하는 사용자 정의 예외
import { v4 as uuidv4 } from 'uuid'; // 고유 식별자를 생성하기 위한 UUID 라이브러리
import { JwtService } from '@nestjs/jwt'; // JWT( JSON Web 토큰) 작업을 처리하는 서비스
import { ConfigService } from '@nestjs/config';
import { LoginResDto } from '../dto'; // 로그인 작업의 응답을 위한 데이터 전송 객체
import { RequestInfo, TokenPayload } from '../types'; // 애플리케이션에서 사용되는 사용자 정의 타입

@Injectable()
export class AuthService {
  // 이 서비스에서 사용할 서비스와 저장소를 주입하기 위해 생성자를 사용
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly accessTokenRepository: AccessTokenRepository,
    private readonly accessLogRepository: AccessLogRepository,
  ) {}

  // 로그인 로직을 처리하는 메소드
  async login(
    email: string,
    plainPassword: string,
    req: RequestInfo,
  ): Promise<LoginResDto> {
    const user = await this.validateUser(email, plainPassword); // 사용자 자격 증명을 검증
    const payload: TokenPayload = this.createTokenPayload(user.id); // 사용자 정보를 포함하는 JWT 페이로드를 생성

    // 액세스 토큰과 갱신 토큰을 효율적으로 동시에 생성하기 위해 Promise.all을 사용
    const [accessToken, refreshToken] = await Promise.all([
      this.createAccessToken(user, payload),
      this.createRefreshToken(user, payload),
    ]);

    // 로깅 목적으로 요청 정보를 추출
    const { ip, endpoint, ua } = req;
    await this.accessLogRepository.createAccessLog(user, ua, endpoint, ip); // 접근 정보를 로깅

    // 토큰과 사용자 상세 정보를 포함하여 로그인 응답을 반환
    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    };
  }

  // JWT에 대한 페이로드를 생성하는 메소드
  createTokenPayload(userId: string): TokenPayload {
    return {
      sub: userId,
      iat: Math.floor(Date.now() / 1000),
      jti: uuidv4(),
    };
  }

  // 사용자에 대한 액세스 토큰을 생성하는 메소드
  async createAccessToken(user: User, payload: TokenPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('ACCESS_TOKEN_EXPIRY'); // 구성에서 토큰 만료 시간을 가져오기
    const token = this.jwtService.sign(payload, { expiresIn }); // 페이로드와 만료 시간을 사용하여 JWT를 서명
    const expiresAt = this.calculateExpiry(expiresIn); // 토큰의 만료 날짜를 계산

    // 데이터베이스에 액세스 토큰을 저장
    await this.accessTokenRepository.saveAccessToken(
      payload.jti,
      user,
      token,
      expiresAt,
    );

    return token;
  }

  // 사용자에 대한 갱신 토큰을 생성하는 메소드
  async createRefreshToken(user: User, payload: TokenPayload): Promise<string> {
    const expiresIn = this.configService.get<string>('REFRESH_TOKEN_EXPIRY'); // 구성에서 갱신 토큰 만료 시간을 가져오기
    const token = this.jwtService.sign(payload, { expiresIn }); // 페이로드와 만료 시간을 사용하여 JWT를 서명
    const expiresAt = this.calculateExpiry(expiresIn); // 토큰의 만료 날짜를 계산

    // 데이터베이스에 갱신 토큰을 저장
    await this.refreshTokenRepository.saveRefreshToken(
      payload.jti,
      user,
      token,
      expiresAt,
    );

    return token;
  }

  // 사용자 자격 증명을 검증하는 비공개 메소드
  private async validateUser(
    email: string,
    plainPassword: string,
  ): Promise<User> {
    const user = await this.userRepository.findOne({ where: { email } }); // 이메일로 사용자를 검색
    if (user && (await argon2.verify(user.password, plainPassword))) {
      // argon2를 사용하여 비밀번호를 검증
      return user; // 자격 증명이 유효하면 사용자를 반환
    }
    // 자격 증명이 유효하지 않은 경우 사용자 정의 예외 출력
    throw new BusinessException(
      'auth',
      'invalid-credentials',
      'Invalid credentials',
      HttpStatus.UNAUTHORIZED,
    );
  }

  // 문자열로 주어진 만료 시간을 기준으로 토큰 만료 날짜를 계산하는 비공개 메소드
  private calculateExpiry(expiry: string): Date {
    let expiresInMilliseconds = 0;

    // 만료 시간 문자열을 밀리초로 변환(일, 시간, 분, 초 단위)
    if (expiry.endsWith('d')) {
      const days = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = days * 24 * 60 * 60 * 1000;
    } else if (expiry.endsWith('h')) {
      const hours = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = hours * 60 * 60 * 1000;
    } else if (expiry.endsWith('m')) {
      const minutes = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = minutes * 60 * 1000;
    } else if (expiry.endsWith('s')) {
      const seconds = parseInt(expiry.slice(0, -1), 10);
      expiresInMilliseconds = seconds * 1000;
    } else {
      // 만료 형식이 유효하지 않은 경우 사용자 정의 예외 출력
      throw new BusinessException(
        'auth',
        'invalid-expiry',
        'Invalid expiry time',
        HttpStatus.BAD_REQUEST,
      );
    }

    return new Date(Date.now() + expiresInMilliseconds); // 만료 날짜를 계산하여 반환
  }
}
