# Coin Basecamp Live Calendar Version

## 포함 기능
- CoinDesk RSS 기반 뉴스 자동 로드
- CoinDesk / Cointelegraph 기반 중요 알림 자동 로드
- CoinGecko 실시간 티커
- 캘린더 영역 동적 렌더링

## 환경변수
### 선택
- `OPENAI_API_KEY`
  - 뉴스 한국어 한줄 요약 품질 향상
- `TOKENOMIST_API_KEY`
  - 실제 토큰 잠금해제 일정(Token Unlock) 로드

## 캘린더 동작 방식
- `TOKENOMIST_API_KEY`가 있으면 Tokenomist의 토큰 잠금해제 API로 실제 일정 데이터를 불러옵니다.
- 키가 없으면 기본 예시 일정이 보입니다.

## 배포
1. GitHub에 업로드
2. Netlify에서 Import from Git
3. 필요하면 Site settings → Environment variables 에 키 추가
