# 커리어캠프

원티드 커리어캠프 1기의 자율 출근 기록 사이트. 출근한 날만큼 나무가 자라고, 20일을 채우면 열매가 열린다.
기준 문서는 [docs/spec.md](docs/spec.md)다.

## 준비

- Node.js 26 (`.nvmrc`, Vercel 프로젝트와 같은 메이저)
- pnpm 10 (`corepack enable pnpm` 또는 `npm i -g pnpm@10`으로 설치한다. 버전은 루트 `package.json`의 `packageManager`)

## 실행

루트에서 실행한다.

```bash
pnpm install
pnpm dev        # http://localhost:3000
pnpm build
pnpm lint
pnpm typecheck
pnpm test
```

환경 변수는 `apps/web/.env.example`을 `apps/web/.env.local`로 복사해 채운다. 4단계(서버)부터 필요하다.

## 구조

| 경로 | 내용 |
| --- | --- |
| `apps/web` | Next.js 16 앱 (spec 6.2) |
| `packages` | 앱 둘 이상이 같이 쓸 코드. 지금은 비어 있다 |
| `design/reference/prototype.html` | 기획 단계의 예시 사이트. 고치지 않는다 |
| `design/handoff` | 디자이너 작업물. [design/README.md](design/README.md) |
| `docs/spec.md` | 기획서 |
| `docs/design-log.md` | 디자인 반영 기록과 남은 질문 |
| `supabase/migrations` | 데이터베이스 스키마 (4단계) |
