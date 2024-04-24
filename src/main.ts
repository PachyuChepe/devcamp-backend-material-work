import * as fs from 'fs';
import * as https from 'https';
import * as path from 'path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { corsOption, getNestOptions } from './app.options';
import { ConfigService } from '@nestjs/config';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { BusinessExceptionFilter } from './exception';

async function bootstrap() {
  initializeTransactionalContext();

  const app = await NestFactory.create(AppModule, getNestOptions());
  app.useGlobalFilters(new BusinessExceptionFilter());

  // 환경변수 설정
  const configService = app.get(ConfigService);
  const port = configService.get<number>('SERVER_PORT') || 4000;
  const env = configService.get<string>('SERVER_RUNTIME');
  const serviceName = configService.get<string>('SERVER_SERVICE_NAME');

  // 인증 키 파일 경로 설정
  const keyPath = path.join(__dirname, '..', 'key.pem');
  const certPath = path.join(__dirname, '..', 'cert.pem');

  app.enableCors(corsOption(env));

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
    console.log(
      `HTTPS server running on\nruntime: ${env}\nport: ${port}\nserviceName: ${serviceName}`,
    );
  } else {
    // 인증서가 없을 경우 HTTP로 실행
    await app.listen(port);
    console.log(
      `HTTP server running on\nruntime: ${env}\nport: ${port}\nserviceName: ${serviceName}`,
    );
  }
}

bootstrap();
