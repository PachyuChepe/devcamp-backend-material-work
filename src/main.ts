// src/main.ts
import * as fs from 'fs'; // 파일 시스템 모듈로 파일 시스템과 상호 작용
import * as https from 'https'; // HTTPS 서버를 생성하기 위한 HTTPS 모듈
import * as path from 'path'; // 파일 및 디렉토리 경로 작업을 위한 Path 모듈
import { NestFactory } from '@nestjs/core'; // NestJS 애플리케이션 인스턴스 생성을 위한 NestFactory
import { AppModule } from './app.module'; // 어플리케이션의 루트 모듈 가져오기
import { corsOption, getNestOptions } from './app.options'; // CORS 및 NestJS 애플리케이션 옵션 가져오기
import { ConfigService } from '@nestjs/config'; // 애플리케이션 구성에 접근하기 위한 ConfigService
import { initializeTransactionalContext } from 'typeorm-transactional'; // ORM 트랜잭션 관리
import { BusinessExceptionFilter } from './exception'; // 특정 오류를 처리하기 위한 사용자 지정 예외 필터

// NestJS 애플리케이션을 설정하고 시작하기 위해 'bootstrap'이라는 비동기 함수를 정의
async function bootstrap() {
  // 데이터베이스 작업에서 트랜잭션의 원자성을 보장하기 위해 트랜잭셔널 컨텍스트를 초기화
  initializeTransactionalContext();

  // 특정 옵션으로 새로운 NestJS 애플리케이션 인스턴스를 생성
  const app = await NestFactory.create(AppModule, getNestOptions());
  // 전체 애플리케이션에서 특정 비즈니스 예외를 처리하기 위해 전역 예외 필터를 적용
  app.useGlobalFilters(new BusinessExceptionFilter());

  // 환경 또는 기타 외부 소스에서 구성 설정을 검색
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT') || 4000; // 지정되지 않은 경우 기본 포트 4000 사용
  const env = configService.get<string>('SERVER_RUNTIME'); // 서버가 실행되는 환경
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME'); // 식별을 위한 서비스 이름

  // HTTPS를 위한 SSL 키 및 인증서의 경로 설정
  const keyPath = path.join(__dirname, '..', 'key.pem');
  const certPath = path.join(__dirname, '..', 'cert.pem');

  // 환경별 옵션을 사용하여 CORS를 활성화
  app.enableCors(corsOption(env));

  // SSL 키와 인증서 파일이 있는지 확인
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    // SSL 키와 인증서 파일을 읽음
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };

    // 애플리케이션 경로 및 기타 설정을 초기화
    await app.init();
    // SSL 옵션과 NestJS 애플리케이션을 요청 핸들러로 사용하여 HTTPS 서버를 생성
    https
      .createServer(httpsOptions, app.getHttpAdapter().getInstance())
      .listen(port);
    console.log(
      `HTTPS server running on\nruntime: ${env}\nport: ${port}\nserviceName: ${serviceName}`,
    );
  } else {
    // SSL 파일을 찾지 못한 경우 애플리케이션을 HTTP로 시작
    await app.listen(port);
    console.log(
      `HTTP server running on\nruntime: ${env}\nport: ${port}\nserviceName: ${serviceName}`,
    );
  }
}

bootstrap();
