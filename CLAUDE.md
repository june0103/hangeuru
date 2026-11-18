# 커리어캠프 출근부

원티드 커리어캠프 1기의 자율 출근 기록 사이트. 기준 문서는 docs/spec.md 다.

## 먼저 읽을 것
- docs/spec.md: 규칙(2장), 화면(3·4장), 몽타주(5장), 구조(6·12장), 데이터와 서버(7·8장), 작업 순서(13장)
- design/handoff/ 의 가장 최근 폴더: 화면 모양의 최신 기준
- design/reference/prototype.html: 참고용. 수정하지 않는다

## 명령
- pnpm dev, pnpm build, pnpm lint, pnpm typecheck, pnpm test (루트에서 실행)

## 지킬 것
- UI는 @montage-ui/core, icon, nextjs 4.3.2. 몽타주에 있는 컴포넌트를 새로 만들지 않는다
- 색은 theme 콜백의 semantic 토큰으로 쓴다. 헥스 값과 var(--semantic-…)을 쓰지 않는다
- 몽타주 컴포넌트의 props는 추측하지 않는다. node_modules/@montage-ui/core 의 타입 정의나
  github.com/wanteddev/montage-web 의 docs/data/components/**/web.mdx 예제로 확인한다
- 규칙 계산은 apps/web/lib/rules.ts 에만, 화면 문구는 apps/web/lib/copy.ts 에만 둔다
- 날짜와 시각은 서버에서 KST로 만든다. 브라우저 시계를 쓰지 않는다
- 쓰기는 서버 액션에서만 한다. 브라우저에서 Supabase에 직접 쓰지 않는다
- .env.local 과 SUPABASE_SECRET_KEY 를 커밋하지 않는다

## 무엇이 기준인가
- 화면 모양: 디자이너의 가장 최근 시안, 그다음 docs/spec.md, 그다음 prototype.html
- 규칙, 데이터, 서버 동작: docs/spec.md
- 서로 부딪히거나 문서에 없으면 구현 전에 사용자에게 묻는다

## 일하는 순서
- docs/spec.md 13.2의 단계를 순서대로 한다. 단계가 끝나면 완료 기준을 확인하고 커밋한 뒤 보고한다
- 평소 커밋과 푸시는 develop 에 한다. main 은 운영 배포용이라 사용자가 배포를 요청할 때만 develop 을 합쳐 푸시한다(12.2)
- 규칙이나 화면이 바뀌면 docs/spec.md 를 먼저 고치고 코드를 고친다
- 디자이너 작업물은 docs/spec.md 12.5 순서로 반영하고 docs/design-log.md 에 기록한다
