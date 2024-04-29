// src/auth/controllers/auth.controller.ts
import { Body, Controller, Post, Req } from '@nestjs/common';
import { AuthService, UserService } from '../services';
import { CreateUserDto, LoginReqDto, LoginResDto, SignupResDto } from '../dto';

// 'auth' 경로로 시작하는 라우터의 컨트롤러를 정의
@Controller('auth')
export class AuthController {
  // AuthService와 UserService의 인스턴스를 이 클래스 안에서 사용하도록 의존성 주입을 통해 선언
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  // HTTP POST 요청을 'auth/signup' 경로로 매핑하고, 회원가입 로직을 처리
  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto): Promise<SignupResDto> {
    // UserService를 사용하여 사용자를 생성하고, 결과를 user 변수에 저장
    const user = await this.userService.createUser(createUserDto);
    // 생성된 사용자 정보 중 일부를 반환
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
    };
  }

  // HTTP POST 요청을 'auth/login' 경로로 매핑하고, 로그인 로직을 처리
  @Post('login')
  async login(
    @Req() req, // 요청 객체를 통해 추가 정보를 얻기 위해 Req 데코레이터를 사용
    @Body() loginReqDto: LoginReqDto, // 로그인 요청의 바디에서 데이터를 가져오기
  ): Promise<LoginResDto> {
    // 요청 객체에서 IP, 요청 메서드, 요청된 URL을 추출
    const { ip, method, originalUrl } = req;
    // 로그인 요청 정보를 객체로 구성
    const reqInfo = {
      ip, // 요청한 클라이언트의 IP 주소
      endpoint: `${method} ${originalUrl}`, // 요청 메서드와 URL을 조합한 엔드포인트 정보
      ua: req.headers['user-agent'] || '', // 사용자 에이전트 정보, 없으면 빈 문자열
    };

    // AuthService의 로그인 함수를 호출하여 로그인을 수행
    return this.authService.login(
      loginReqDto.email, // 이메일
      loginReqDto.password, // 패스워드
      reqInfo, // 요청 정보
    );
  }
}
