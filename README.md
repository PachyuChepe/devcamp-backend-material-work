### 로컬 환경 HTTPS 세팅

- 운영체제: Windows 10
- 필수 설치: chocolatey & mkcert

```
# 프로젝트 루트 디렉토리
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
```
