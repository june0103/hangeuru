# 커리어캠프 출근부

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

## 팀원 시작하기

작업을 이어받는 사람이 처음 한 번 하는 일이다. clone만으로는 실행되지 않는다. DB 키는 저장소에 없다.

### 1. 권한 받기

저장소 주인에게 아래 둘을 요청한다.

| 어디 | 받을 권한 | 쓰는 곳 |
| --- | --- | --- |
| GitHub `june0103/hangeuru` | Collaborator(쓰기) | `develop`, `main`에 push |
| Supabase 프로젝트 | 멤버 초대 | API 키 확인, SQL 실행, 빠진 출근 넣기(spec 11.2) |

Vercel은 따로 권한이 없어도 된다. GitHub에 push하면 자동으로 배포된다. Hobby 플랜이라 팀원을 Vercel 프로젝트에 넣을 수 없어서, 배포 상태와 로그는 저장소 주인 계정에서만 본다.

### 2. 설치

```bash
brew install node@26 && npm i -g pnpm@10
```

```bash
git clone https://github.com/june0103/hangeuru.git && cd hangeuru && pnpm install
```

기본 브랜치가 `develop`이라 clone하면 `develop`에서 시작한다.

### 3. 환경 변수

```bash
cp apps/web/.env.example apps/web/.env.local
```

Supabase 대시보드의 Project Settings → API Keys에서 값을 직접 복사해 채운다. 키를 메신저나 채팅으로 주고받지 않는다.

| 이름 | 값 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 프로젝트 URL (`https://….supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_…` |
| `SUPABASE_SECRET_KEY` | `sb_secret_…`. 서버 전용이고 절대 커밋하지 않는다 |
| `DEV_TODAY` | 개발 전용. 오늘 날짜를 바꿔 볼 때 `2026-12-17`처럼 적는다. 운영에서는 무시된다 |
| `DEMO_USER_ID` | 없어도 된다. 시연 계정의 사용자 id. 그 한 명만 출근 20일로 보인다(spec 2.9) |

### 4. 실행과 확인

```bash
pnpm dev
```

http://localhost:3000 에서 가입하고 출근해 본다. 출근·퇴근은 그라운드 반경 500m 안에서만 기록된다(spec 2.8). 그라운드 밖에서 개발할 때는 브라우저 개발자 도구의 Sensors → Location에서 위치를 37.503763, 127.103984로 바꾼다.

### 알아 둘 것

- **로컬도 운영 DB를 쓴다.** 개발용 DB가 따로 없어서 로컬에서 가입·출근하면 실제 구성원 데이터에 섞인다. 확인용 계정은 끝나면 Supabase Authentication 화면에서 지운다. `DEV_TODAY`를 켜고 출근하면 그 날짜로 기록되니 특히 조심한다.
- **브랜치:** 평소 작업은 `develop`에 push한다. `main`은 운영 배포용이라, 배포할 때만 `develop`을 합쳐 push한다. `main`에 push하면 바로 https://hangeuru.vercel.app 에 반영된다(spec 12.2).
- **먼저 읽을 문서**
  - [CLAUDE.md](CLAUDE.md): 작업 규칙. Claude Code로 작업하면 자동으로 읽는다
  - [docs/spec.md](docs/spec.md): 기획서. 규칙이나 화면을 바꿀 때는 이 문서를 먼저 고치고 코드를 고친다
  - [docs/design-log.md](docs/design-log.md): 기획서와 다르게 정한 것과 그 이유
- **저장소는 공개다.** 코드와 기획서는 누구나 볼 수 있다. 키는 `.env.local`에만 둔다.

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
