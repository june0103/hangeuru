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
