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
