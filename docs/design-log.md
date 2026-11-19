# 디자인 반영 기록

디자이너 작업물을 반영할 때마다 날짜, 폴더, 바뀐 화면, 남은 질문을 적는다(spec 12.5).

| 날짜 | 폴더 | 바뀐 화면 | 남은 질문 |
| --- | --- | --- | --- |
| | | | |

## 구현 메모

기획서에 없던 결정과 라이브러리가 문서와 다르게 동작한 점을 적는다.

### 2026-11-18 1단계(저장소 뼈대)

- 저장소 루트는 `hangeuru` 폴더(원격 `github.com/june0103/hangeuru`)다. 기획서 12.1의 `camp-attendance/`는 루트 `package.json`의 `name`으로만 쓴다 (사용자 확인)
- Node.js 24, pnpm 10.34.9로 고정했다 (`.nvmrc`, `packageManager`). Vercel 프로젝트도 Node.js 24.x로 맞춘다 (사용자 확인)
- `@montage-ui/engine` 4.3.2는 `@emotion/react`, `@emotion/cache` 등을 optional peer로도 선언해서 pnpm이 설치하지 않는다. `apps/web`에 `@emotion/react`, `@emotion/cache`, `@emotion/server`, `@emotion/serialize`, `@emotion/utils`를 직접 추가했다
- `create-next-app` 16.4.6이 기본으로 켜는 `cacheComponents`, `partialPrefetching`을 껐다. 6.5의 "모든 화면은 요청마다 새로 그린다"를 기본 동적 렌더링으로 맞추기 위해서다
- 몽타주 `sx` 콜백은 `theme` 타입을 추론하지 못해 `(theme: Theme) =>`로 타입을 적는다
- `typecheck` 스크립트는 `next typegen && tsc --noEmit`이다
- Vitest는 1단계에 설치하고 테스트가 없어도 통과하게 했다(`passWithNoTests`). CI의 `pnpm test`가 2단계 전에도 돈다
- 브랜치를 `develop`(평소 푸시, Vercel 미리보기)과 `main`(운영 배포 전용)으로 나눴다. spec 11.1, 12.2, 13.3과 CLAUDE.md, CI에 반영했다 (사용자 요청)

### 2026-11-18 2단계(규칙)

- `lib/rules.ts`, `lib/time.ts`는 spec 2.5, 6.3 코드를 그대로 옮겼다
- `lib/tree.ts`는 SVG를 직접 만들지 않고 그림 데이터(`treeModel`)만 돌려준다. 나무 색은 역할 이름(`leaf`, `leafDark`, `trunk`, `soil`, `seed`)으로 넘기고 3단계 `TreeFigure`가 몽타주 토큰으로 바꾼다. 헥스는 4.4의 고정색만 쓴다
- 잎은 prototype의 `treeSVG`처럼 새 잎(i = n)부터 그린다. spec 4.2에 그리는 순서가 없어 예시 사이트를 따랐다
- `apps/web/package.json`에 `"type": "module"`을 넣었다. Vitest(Vite)가 ESM 설정 파일을 CommonJS로 읽는다는 경고를 없애기 위해서다

### 2026-11-18 3단계(화면)

- `DEV_TODAY`(YYYY-MM-DD)로 개발 환경의 오늘을 바꾼다. 서버 전용이고 `NODE_ENV=production`이면 무시한다 (사용자 확인). 출근 시각은 그 날짜에 지금 KST 시각을 붙인다
- 버튼은 `app/actions.ts`의 서버 액션을 부르고, 3단계의 `lib/data.ts`는 fixtures를 개발 서버 메모리에 두고 바꾼다. 서버를 다시 켜면 처음 상태로 돌아간다. 4단계에서는 `lib/data.ts`만 Supabase로 바꾸고 화면 코드는 그대로 둔다
- 3단계 로그인은 fixtures 계정과 쿠키(`yeolmae-fixture-session`)로 흉내 낸다. 테스트 계정은 `lib/fixtures.ts`에 있다
- 계산은 `lib/view.ts`가 규칙과 문구를 합쳐 패널이 그릴 값으로 만든다. 패널은 이 값만 받는다
- 홈 배치는 패널을 한 번만 그리고 992px 미만에서 단 래퍼를 `display: contents`로 풀어 순서를 바꾼다(예시 사이트와 같은 방식)
- 몽타주 `BottomNavigation`은 위치를 잡지 않아 고정 래퍼로 감쌌다. 토스트 위치는 `RegionConfig viewportBottom`에 CSS 변수를 넘겨 모바일 72px, 홈 148px로 맞췄다(몽타주 토스트 영역이 모바일에서 아래 20px를 더한다)
- 몽타주 `FormControlMessage`는 `FormControl` 안에서만 쓸 수 있어 씨앗·플랜 묶음도 `FormControl`로 감쌌다
- 씨앗 선택의 라디오는 상자 테두리로만 선택을 보이도록 투명하게 상자 전체에 겹쳐 두었다(키보드와 스크린리더용)
- 열매 터치 영역은 모바일 그림 폭 220px에서도 지름 64px가 되도록 768px 미만에서 반지름을 키운다
- 캘린더의 공휴일 이름과 "오늘" 글자도 모바일에서는 시간 글자처럼 화면에서만 숨긴다(예시 사이트와 같다)
- 홈 화면 아이콘은 `app/icons/[size]`에서 브랜드 마크를 PNG로 만든다. 파비콘은 `app/icon.tsx`

남은 확인(3단계에서 못 한 것)
- "이미지 복사" 붙여 넣기는 실제 기기(데스크톱 Chrome, iOS Safari, Android Chrome)에서 확인해야 한다
- 홈 인디케이터가 있는 아이폰의 안전 영역과 "홈 화면에 추가"는 실기기에서 확인해야 한다

### 2026-11-18 4단계(서버)

- Supabase 연결 코드는 공식 Next.js 예제(`vercel/next.js` examples/with-supabase)와 `@supabase/ssr` 0.12.7 타입을 따랐다. 공식 문서 페이지의 코드 블록은 페이지를 그린 뒤에 나타나서 받아 오지 못했다
- `@supabase/ssr` 0.12.7의 `setAll(cookies, headers)`가 캐시 금지 헤더를 넘겨 준다. `proxy.ts`는 이 헤더를 응답과 리다이렉트 응답에 함께 옮긴다
- 새 Supabase 프로젝트는 새 테이블에 `service_role` 권한을 주지 않아 secret key 쓰기가 막혔다. `0002_service_role.sql`을 추가하고 spec 7.1, 11.1을 고쳤다(라이브러리가 문서와 다르게 동작해 보고 후 진행, spec 13.4)
- `lib/data.ts`는 같은 함수 이름으로 Supabase 구현이 됐다. 3단계 fixtures는 단위 테스트에서만 쓴다
- 로그인했지만 profiles 행이 없으면 `/auth/signout`(GET)에서 로그아웃시키고 `/login`으로 보낸다. 서버 컴포넌트는 쿠키를 지울 수 없어서다
- 예상하지 못한 실패는 `unstable_rethrow`로 redirect 신호만 다시 던지고 나머지는 공통 실패 문구로 돌려준다

확인한 것(로컬, 실제 Supabase)
- 공개 가입 API가 `signup_disabled`로 거절된다. 로그인하지 않은 사람은 테이블을 읽을 수 없다
- 가입 → 자동 로그인 → 환영 토스트, 같은 이메일 재가입 오류, 없는 이메일·틀린 비밀번호 같은 문구, 보호 경로 리다이렉트, 로그아웃
- 예시 기록 19일(운영자처럼 secret key로 넣음)에서 spec 2.6 첫 줄 값, 출근 → 열매 → 수확 → 수확 카드, 과수원, 캘린더(시각 없는 기록은 "–")
- 구성원 토큰으로 attendance 추가·삭제와 profiles.harvested_at 수정이 모두 403으로 거절된다
- `.next/static`에 secret key 값과 변수 이름이 없다
- 점검용 계정은 지웠다(profiles, attendance도 같이 지워짐)

확인하지 못한 것
- 19일 계정으로 `harvest` 액션을 직접 불러 서버가 거절하는지는 코드로만 확인했다(액션이 기록을 다시 읽어 20일 미만이면 거절)

### 2026-11-18 5단계(배포)

- Vercel 프로젝트 `hangeuru`(MedicalMate, Hobby)를 대시보드에서 만들었다. Root Directory `apps/web`, Production Branch `main`, 환경 변수 3개(Production, Preview)
- Vercel 프로젝트의 Node.js가 26.x라서 그대로 두고 `.nvmrc`를 24에서 26으로 바꿨다(사용자 결정). 1단계의 "Node.js 24" 결정을 대신한다
- 배포 주소에서 보호 경로 리다이렉트, `noindex`, 캐시 금지 헤더, 매니페스트와 아이콘, 클라이언트 번들에 secret key가 없음을 확인했다
- 배포 주소에서의 가입·출근·퇴근 확인은 사용자가 직접 한다(운영 사이트에 에이전트가 계정을 만들지 않는다)

### 2026-11-18 위치 기반 출퇴근

- 사용자 요청으로 출근·퇴근을 캠프 반경 500m 안에서만 기록하게 바꿨다. spec 1장, 2.7, 2.8(새로), 8.1~8.3, 9.3, 10장, 11.3을 먼저 고쳤다
- 캠프: 서울 송파구 백제고분로37길 22. OpenStreetMap에서 건물 단위 좌표가 나오지 않아 도로 단위 좌표(37.5040, 127.1042)를 쓴다. 정확한 좌표를 받으면 `lib/rules.ts`의 `CAMP`만 바꾼다
- 위치를 구하지 못하면 기록을 막는다. 위치는 저장하지 않는다(사용자 결정)
- 위치는 브라우저가 보내는 값이라 위조할 수 있다. 가벼운 확인으로 본다

### 2026-11-18 서비스 이름과 로고

- 서비스 이름을 "커리어캠프"로 바꿨다(spec 11.3 확정). `lib/copy.ts`의 `APP_NAME` 하나로 헤더, 탭 제목, 매니페스트, 수확 카드가 바뀐다
- 로고는 캠프 배너 분위기를 참고해 새로 그린 유리 큐브(`design/handoff/2026-11-18-logo`, Claude Code 초안). 캠프 공식 로고(AI Native Frontiers)는 쓰지 않는다(spec 5.2)
- 헤더는 `public/brand/mark.svg` + "커리어캠프", 파비콘은 `app/icon.svg`, 홈 화면 아이콘은 `public/brand/icon.svg`를 PNG로 바꿔 낸다. 사과 브랜드 마크 코드(`brandMarkSvg`)는 지웠다. 나무·열매 그림은 그대로다

### 2026-11-18 이름 "커리어캠프 출근부", 헤더 마크 32px

- 서비스 이름을 "커리어캠프 출근부"로 바꿨다. 홈 화면 아이콘 아래처럼 좁은 곳은 짧은 이름 "커리어캠프"(`APP_SHORT_NAME`)
- 헤더 마크를 24px에서 32px로 키우고, `public/brand/mark.svg`의 viewBox를 큐브에 맞춰 여백을 줄였다(핸드오프 폴더 원본은 그대로)
- 이름이 길어져 768px 미만에서 6글자 이상 이름이 브랜드와 겹쳤다. 모바일 헤더는 "{이름}님" 대신 사람 아이콘 버튼(44px)만 둔다(spec 3.2)

### 2026-11-18 "캠프" → "그라운드"

- 캠프 교육장을 부르는 이름이 "그라운드"라서, 장소를 뜻하는 "캠프"를 모두 "그라운드"로 바꿨다: "오늘 그라운드" 패널, "그라운드에 있어요" 배지, "지금 n명이 그라운드에 있어요", 위치 안내("그라운드에서 610m 떨어져 있어요. 그라운드 500m 안에서…")
- 프로그램을 뜻하는 "캠프"(캠프 1기, 캠프에서 쓰는 이름, 캠프 채널, 커리어캠프)는 그대로 둔다. spec 9.2 용어 표에 "그라운드"를 추가했다
- 코드의 상수 이름 `CAMP`, 컴포넌트 이름 `CampPanel`은 그대로 둔다

### 2026-11-18 그라운드 좌표

- 사용자가 지도에서 복사한 건물 좌표(37.503763, 127.103984)로 `CAMP`를 바꿨다. 이전 도로 단위 좌표에서 약 33m 옮겨졌다. spec 2.8과 README도 고쳤다

### 2026-11-19 캘린더 기록 표 줄바꿈

- 768px 미만에서 기록 표의 출근·퇴근 시각이 "0 9 : 5 2"처럼 한 글자씩 세로로 끊겼다. 몽타주 `TableCell`·`TableHeadCell` 스타일 자체에 `overflow-wrap: anywhere`가 있어 칸의 최소 폭이 한 글자까지 줄고, 폭 100% 표가 시각 열을 31px까지 좁혔다(전역 줄바꿈 설정도 같은 값이다)
- 표의 모든 칸을 한 줄(`white-space: nowrap`)로 두었다. 넘치면 몽타주 `Table`의 ScrollArea 안에서 표만 가로로 스크롤한다. spec 3.6 "좁은 화면에서는 표만 가로로 스크롤한다"와 같아서 spec은 고치지 않았다

### 2026-11-19 비밀번호 확인 칸과 보기 버튼

- 가입 폼에 "비밀번호 확인" 칸을 추가했다. 비었으면 "비밀번호를 한 번 더 입력해 주세요.", 다르면 "비밀번호가 일치하지 않아요."(spec 3.4). 서버 액션 `signUp`도 같은 검사를 한다
- 비밀번호 칸(로그인, 가입의 두 칸)은 기본으로 글자를 가리고, 눈 아이콘 버튼으로 보이기·숨기기를 바꾼다(`components/PasswordField.tsx`, spec 3.3). 로그인 칸에도 같이 넣었다

### 2026-11-19 동시 사용 대비

- Vercel 함수가 미국 동부(`iad1`)에서 돌아 서울 DB를 다녀올 때마다 왕복이 길었다. `apps/web/vercel.json`으로 서울(`icn1`)에 고정했다(spec 6.5, 11.1)
- 한 요청 안에서 로그인 사용자와 내 프로필을 한 번만 읽게 `react`의 `cache`로 묶었다. 출근 액션은 저장 뒤 기록을 다시 읽지 않고 저장한 값을 더해 계산한다
- 모든 로그인이 Vercel 서버 IP에서 나가서 Supabase 로그인 횟수 제한을 구성원 전체가 나눠 쓴다. 제한(429)에 걸리면 "비밀번호가 맞지 않아요" 대신 "잠시 후 다시 시도해 주세요."를 보인다. 가입 직후 로그인만 실패하면 "가입은 끝났어요. 잠시 후 로그인해 주세요."(spec 8.3). Supabase 대시보드 Rate Limits에서 한도를 올리는 건 운영자 일이다

### 2026-11-19 Supabase 로그인 한도

- 앞 기록의 "IP당 5분 150회"는 잘못이었다. 이 프로젝트의 Rate Limits는 로그인(sign-ups and sign-ins)과 토큰 갱신(token refreshes)이 따로 있고, 로그인 기본값은 5분에 30회였다
- 구성원이 약 30명이라 로그인 한도를 5분에 100회로 올렸다(운영자가 대시보드에서 저장). 토큰 갱신은 기본값 150회 그대로 둔다. spec 7.4 표에 적었다
