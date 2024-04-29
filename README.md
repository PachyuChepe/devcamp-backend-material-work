### 로컬 환경 HTTPS 세팅

- 운영체제: Windows 10
- 필수 설치: chocolatey & mkcert

```
# 프로젝트 루트 디렉토리
mkcert -key-file key.pem -cert-file cert.pem localhost 127.0.0.1 ::1
```

### PG사 결제 흐름 구상 (자동결제)

1. 고객이 결제 페이지로 넘어가면 클라이언트에서 카드 등록창 호출
2. 카드 등록창이 띄워지면 정보 입력
3. 고객정보와 카드정보가 일치할 경우 SuccessUrl로 이동하고 빌링키(카드 정보가 담겨져 있음)가 발급됨
4. 서버는 해당 빌링키를 DB에 저장하며, 원하는 시점(노드 스케쥴러 등을 활용)에 API로 빌링 결제 승인 요청을 PG사로 전송
5. 결제 진행 시 금액의 일정량을 포인트로 환급
6. 장기 구독 시 할인 및 한달을 무료로 사용할 수 있는 쿠폰을 발급 (해당 쿠폰은 결제를 관리하는 페이지에서 적용 가능하게끔 구현?)

참고자료- https://docs.tosspayments.com/guides/billing/integration
