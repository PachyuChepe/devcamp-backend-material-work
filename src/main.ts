import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // 기본 포트 설정
  const port = configService.get<number>('SERVER_PORT') || 3000;

  // 인증 키 파일 경로 설정
  const keyPath = path.join(__dirname, '..', 'key.pem');
  const certPath = path.join(__dirname, '..', 'cert.pem');

  // HTTPS 설정
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    const httpsOptions = {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    };
    await app.init();
    https
      .createServer(httpsOptions, app.getHttpAdapter().getInstance())
      .listen(port);
    console.log(`HTTPS server running on port ${port}`);
  } else {
    // 인증서가 없을 경우 HTTP로 실행
    await app.listen(port);
    console.log(`HTTP server running on port ${port}`);
  }
}

bootstrap();
