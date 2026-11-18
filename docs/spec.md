# 커리어캠프 출근부 구현 기획서

Nov 18, 2026 · @June

## 1. 개요

커리어캠프 출근부는 원티드 커리어캠프 1기 구성원이 2026-11-23부터 2026-12-25까지(미리 나오는 사람은 11-18부터) 자율 출근을 꾸준히 이어가도록 돕는 출근 기록 사이트다. 가입할 때 고른 씨앗이 출근한 날만큼 자라 나무가 되고, 출근 20일을 채우면 열매가 열린다. 열매를 눌러 수확하면 출근 기록을 요약한 수확 카드 이미지가 나오고, 이 이미지를 운영진에게 DM으로 보내면 커피 쿠폰으로 바꿔 준다.

근태 관리 도구가 아니라 동기부여 도구다. 지각·조퇴·결근 같은 판정이 없고, 나온 날만 센다. 이 문서는 구현 에이전트가 이대로 만들면 [예시 사이트](https://claude.ai/artifact/VMePm6xLE98gMfKFcMxCT4)와 같은 결과가 나오도록 규칙, 화면, 수치, 문구를 모두 고정한다. 문서와 예시 사이트가 다르면 이 문서를 따른다.

스마트폰으로 쓰는 사람이 많으므로 모바일 화면을 기준으로 먼저 만들고 넓은 화면으로 넓힌다(3.10).

코드는 Git 모노레포로 관리하고, 디자이너가 올리는 작업물에 맞춰 화면을 계속 고쳐 나간다. 저장소 구조와 디자인 반영 방식은 12장, 구현 에이전트(Claude Code)의 작업 순서는 13장에 있다. 에이전트는 13장부터 읽는다.

| 항목 | 범위 | 범위 밖 |
| --- | --- | --- |
| 사용자 | 링크를 받은 캠프 1기 구성원. 가입 제한 없음 | 초대 코드, 가입 승인, 검색 노출, 조직·기수 여러 개 |
| 기록 | 출근, 퇴근(선택) | 지난 날을 본인이 직접 추가, 휴가·반차 신청, 지각·조퇴 판정, 근무시간 정산 |
| 인증 | 이메일과 비밀번호 가입·로그인. 출근·퇴근은 그라운드 반경 500m 안에서만(2.8) | 소셜 로그인, 이메일 확인, 비밀번호 재설정, IP 출근 인증, 위치 저장 |
| 동기부여 | 씨앗 고르기, 자라는 나무, 열매 수확, 주간 목표, 연속 달성, 모두의 과수원 | 순위표, 벌점, 알림 메일·푸시 |
| 보상 | 수확 카드 이미지를 복사하거나 저장해 운영진에게 DM으로 보낸다. 쿠폰은 운영진이 직접 준다 | 사이트 안에서 쿠폰 발급, 쿠폰 사용 처리 |
| 운영 | 시즌 날짜와 공휴일은 코드 상수 | 관리자 화면 |

## 2. 핵심 규칙

모든 날짜와 시각은 한국 시간(Asia/Seoul) 기준이고, "오늘"은 항상 서버가 계산한다. 아래 정의와 2.4의 기준 코드를 그대로 구현한다.

### 2.1 시즌과 출근일

정식 기간은 2026-11-23(월)부터 2026-12-25까지다. 11-18부터 미리 나오는 사람이 있어 출근 기록은 2026-11-18부터 받는다. 날짜 셋을 구분해 쓴다.

| 상수 | 날짜 | 쓰임 |
| --- | --- | --- |
| `SEASON.open` | 2026-11-18(수) | 이날부터 출근을 기록할 수 있다 |
| `SEASON.start` | 2026-11-23(월) | 정식 시작일. 주간 목표는 이날부터 센다 |
| `SEASON.end` | 2026-12-25(금) | 마지막 날 |

출근일은 `open`부터 `end`까지의 월요일\~금요일 중 공휴일이 아닌 날이고, 공휴일은 2026-12-25(성탄절) 하루뿐이다. 출근일은 사전 기간 3일과 정식 기간 24일을 합쳐 27일이다. 한 주는 월요일에 시작한다.

| 구분 | 주 시작(월) | 출근일 | 일수 | 주간 목표 |
| --- | --- | --- | --- | --- |
| 사전 기간 | 2026-11-16 | 11-18, 11-19, 11-20 | 3 | 없음 |
| 1주차 | 2026-11-23 | 11-23 \~ 11-27 | 5 | 있음 |
| 2주차 | 2026-11-30 | 11-30 \~ 12-04 | 5 | 있음 |
| 3주차 | 2026-12-07 | 12-07 \~ 12-11 | 5 | 있음 |
| 4주차 | 2026-12-14 | 12-14 \~ 12-18 | 5 | 있음 |
| 5주차 | 2026-12-21 | 12-21 \~ 12-24 | 4 | 있음 |

사전 기간에 나온 날도 출근 1일로 세어 나무가 자란다. 사전 기간에는 주간 목표, 목표 달성, 연속 달성을 세지 않는다.

### 2.2 출근 플랜과 주간 목표

플랜은 주간 목표에만 쓰이고 나무와 열매에는 영향을 주지 않는다. "1\~2일", "3\~4일"의 큰 숫자는 표시 이름일 뿐이고, 작은 숫자가 주간 목표다.

| 코드 | 표시 이름 | 주간 목표(goal) | 설명 문구 |
| --- | --- | --- | --- |
| `light` | 주 1\~2일 | 1 | 일주일에 하루 이틀 나와요. |
| `steady` | 주 3\~4일 | 3 | 일주일에 사나흘 나와요. |
| `daily` | 평일 매일 | 5 | 평일은 빠짐없이 나와요. |

### 2.3 씨앗, 나무, 열매

가입할 때 씨앗을 하나 고른다. 씨앗은 나무와 열매의 모양만 바꾸고 규칙은 모두 같다. 씨앗 종류는 디자이너 시안에 따라 바뀔 수 있다.

| 코드 | 씨앗 이름(`label`) | 열매 이름(`fruit`) | 나무 이름 |
| --- | --- | --- | --- |
| `apple` | 사과 | 사과 | 사과나무 |
| `tangerine` | 귤 | 귤 | 귤나무 |
| `peach` | 복숭아 | 복숭아 | 복숭아나무 |
| `coffee` | 커피 | 커피 열매 | 커피나무 |

나무는 총 출근 일수에 따라 자란다. 플랜이나 주간 목표와는 상관없다.

| 단계 | 총 출근 일수 | 나무 모습 |
| --- | --- | --- |
| 씨앗 | 0일 | 흙에 심은 씨앗 |
| 새싹 | 1\~4일 | 가는 줄기에 잎이 하루에 1장씩 |
| 묘목 | 5\~9일 | 굵어진 줄기에 잎이 하루에 1장씩 |
| 나무 | 10\~14일 | 기둥 위에 잎 덩어리가 하루에 1개씩 |
| 꽃 | 15\~19일 | 나무에 꽃이 하루에 1송이씩 |
| 열매 | 20일 이상 | 꽃이 지고 열매 1개가 열린다 |
| 수확 완료 | 수확한 뒤 | 열매가 나무 아래 바구니에 담긴다 |

열매 기준은 총 출근 20일(`FRUIT_DAYS`)이다. 출근일이 모두 27일이므로 7일까지 빠져도 열매를 맺는다. 열매는 한 사람에 1개이고 수확도 한 번이다. 수확한 뒤에도 출근은 계속 기록되지만 나무는 더 변하지 않는다.

### 2.4 계산 정의

| 이름 | 정의 |
| --- | --- |
| `start` | 정식 시작일과 가입일 중 늦은 날 |
| `days(w)` | 정식 기간 w주의 출근일 중 `start` 이후(당일 포함)인 날 |
| `weekGoal(w)` | `min(goal, days(w).length)` |
| `attended` | 출근 기록이 있는 출근일 중 오늘 이하인 날짜, 오름차순. 사전 기간과 가입 전 날짜도 포함한다 |
| `days` (총 출근 일수) | `attended.length` |
| 단계 | `STAGES`에서 `from`이 `days` 이하인 마지막 항목 |
| 수확 가능 | `days`가 20 이상이고 아직 수확하지 않았다 |
| 이번 주 | 오늘이 속한 정식 주. 시즌 종료 뒤면 마지막 주, 정식 시작 전이면 없음 |
| 주간 달성(`done`) | `weekGoal > 0` 이고 그 주 출근 일수가 `weekGoal` 이상 |
| `streak` (연속 달성) | 이번 주부터 거슬러 올라가며 연속으로 달성한 주의 수 |
| 남은 출근일 | 오늘 뒤의 출근일 수. 오늘이 출근일이고 아직 출근 전이면 오늘도 센다 |

연속 달성을 셀 때 `weekGoal`이 0인 주는 건너뛴다. 이번 주가 아직 달성 전이면 끊긴 것으로 보지 않고 건너뛰며, 시즌이 끝난 뒤에는 마지막 주도 그대로 판정한다.

### 2.5 기준 코드 (`lib/rules.ts`)

예시 사이트에서 검증한 코드다. 그대로 옮긴다. 날짜는 모두 `YYYY-MM-DD` 문자열로 다루고 UTC 연산만 써서 시간대 오차를 막는다.

```ts
// open: 기록을 받기 시작하는 날, start: 정식 시작일(주간 목표 계산 기준), end: 마지막 날
export const SEASON = { open: '2026-11-18', start: '2026-11-23', end: '2026-12-25' };
export const HOLIDAYS: Record<string, string> = { '2026-12-25': '성탄절' };
export const PLANS = {
  light:  { label: '주 1~2일', goal: 1, desc: '일주일에 하루 이틀 나와요.' },
  steady: { label: '주 3~4일', goal: 3, desc: '일주일에 사나흘 나와요.' },
  daily:  { label: '평일 매일', goal: 5, desc: '평일은 빠짐없이 나와요.' },
} as const;
export const SEEDS = {
  apple:     { label: '사과',   fruit: '사과',      obj: '를' },
  tangerine: { label: '귤',     fruit: '귤',        obj: '을' },
  peach:     { label: '복숭아', fruit: '복숭아',    obj: '를' },
  coffee:    { label: '커피',   fruit: '커피 열매', obj: '를' },
} as const;
export const FRUIT_DAYS = 20;
export const STAGES = [
  { key: 'seed',    label: '씨앗', from: 0 },
  { key: 'sprout',  label: '새싹', from: 1 },
  { key: 'sapling', label: '묘목', from: 5 },
  { key: 'tree',    label: '나무', from: 10 },
  { key: 'flower',  label: '꽃',   from: 15 },
  { key: 'fruit',   label: '열매', from: FRUIT_DAYS },
] as const;

const toDate = (s: string) => { const [y, m, d] = s.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)); };
const fmt = (dt: Date) => dt.toISOString().slice(0, 10);
export const addDays = (s: string, n: number) => { const d = toDate(s); d.setUTCDate(d.getUTCDate() + n); return fmt(d); };
export const dow = (s: string) => toDate(s).getUTCDay();            // 0 = 일요일
export const weekStart = (s: string) => addDays(s, -((dow(s) + 6) % 7)); // 그 주 월요일
export const isWorkday = (s: string) =>
  s >= SEASON.open && s <= SEASON.end && dow(s) >= 1 && dow(s) <= 5 && !HOLIDAYS[s];

export const SEASON_WEEKS = (() => {
  const out: string[] = [];
  for (let w = weekStart(SEASON.start); w <= SEASON.end; w = addDays(w, 7)) out.push(w);
  return out;
})();
export const ALL_WORKDAYS = (() => {
  const out: string[] = [];
  for (let d = SEASON.open; d <= SEASON.end; d = addDays(d, 1)) if (isWorkday(d)) out.push(d);
  return out;
})();
export const workdaysOfWeek = (w: string, from: string) => {
  const out: string[] = [];
  for (let i = 0; i < 5; i++) { const d = addDays(w, i); if (isWorkday(d) && d >= from) out.push(d); }
  return out;
};
export const memberStart = (joinDate: string) => (joinDate > SEASON.start ? joinDate : SEASON.start);
// 오늘 이후로 남은 출근일 수. 오늘 이미 출근했으면 오늘은 빼고 센다
export const workdaysLeft = (today: string, hasToday: boolean) =>
  ALL_WORKDAYS.filter(d => d > today || (d === today && !hasToday)).length;

// recordDates: 그 회원의 출근 기록 날짜 전체, today: 서버가 계산한 KST 오늘
export function computeStats(plan: keyof typeof PLANS, joinDate: string, recordDates: string[], today: string) {
  const start = memberStart(joinDate);
  const goal = PLANS[plan].goal;
  const asOf = today > SEASON.end ? SEASON.end : today;
  const dates = recordDates.filter(d => d <= today && isWorkday(d)).sort();
  const weeks = SEASON_WEEKS.filter(w => addDays(w, 6) >= start).map(w => {
    const days = workdaysOfWeek(w, start);
    const g = Math.min(goal, days.length);
    const count = dates.filter(d => d >= w && d <= addDays(w, 6)).length;
    return { w, days, goal: g, count, done: g > 0 && count >= g };
  });
  const cw = weekStart(asOf);
  const cur = weeks.find(x => x.w === cw) ?? null;
  let streak = 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const x = weeks[i];
    if (x.w > cw || x.goal === 0) continue;
    if (x.w === cw && !x.done && today <= SEASON.end) continue;
    if (x.done) streak++; else break;
  }
  return { start, dates, days: dates.length, weeks, cur, streak };
}

// 총 출근 일수로 나무의 단계를 구한다
export function growth(days: number) {
  let index = 0;
  STAGES.forEach((s, k) => { if (days >= s.from) index = k; });
  return { index, cur: STAGES[index], next: STAGES[index + 1] ?? null, canHarvest: days >= FRUIT_DAYS };
}
```

### 2.6 검산용 예시

첫 줄의 "예시 기록"은 예시 사이트의 예시 계정 기록 19일이다. 11-18, 19, 20, 23, 24, 25, 26, 27, 30, 12-01, 02, 04, 07, 08, 10, 11, 14, 15, 16.

| 조건 | 기대값 |
| --- | --- |
| `steady`, 11-18 가입, 예시 기록 19일, 오늘 12-17 | days 19, 꽃 단계, 이번 주 3/3 달성, streak 4, 남은 출근일 6 |
| 위 상태에서 12-17 출근 | days 20, 열매 단계, 수확 가능, 이번 주 4/3, streak 4 |
| `steady`, 11-18 가입, 출근 11-18·19, 오늘 11-20 | days 2, 새싹 단계, 이번 주 없음, streak 0 |
| `light`, 12-17 가입, 출근 없음, 오늘 12-17 | days 0, 씨앗 단계, 이번 주 0/1, 남은 출근일 6, 열매까지 14일 모자람 |
| 단계 경계 | 0일 씨앗, 1일·4일 새싹, 5일·9일 묘목, 10일·14일 나무, 15일·19일 꽃, 20일·27일 열매 |

### 2.7 기록 규칙

| 동작 | 할 수 있는 조건 | 저장되는 값 |
| --- | --- | --- |
| 출근 | 오늘이 출근일이고 오늘 기록이 없고, 지금 위치가 그라운드 반경 안이다(2.8) | 출근 시각 = 서버 현재 시각. 하루 1건 |
| 퇴근 | 오늘 기록에 출근 시각이 있고, 지금 위치가 그라운드 반경 안이다(2.8) | 퇴근 시각 = 서버 현재 시각. 다시 누르면 덮어쓴다 |
| 수확 | 총 출근 20일 이상이고 아직 수확하지 않았다 | 수확 시각 = 서버 현재 시각. 되돌릴 수 없다 |
| 이름 변경 | 앞뒤 공백을 뺀 2\~20자 | 이름 |
| 씨앗 변경 | 수확하기 전까지 | 씨앗. 자란 정도는 그대로다 |
| 플랜 변경 | 언제든 | 플랜. 주간 목표와 연속 달성은 새 플랜으로 시즌 전체를 다시 계산한다 |

퇴근은 선택이며 누르지 않아도 출근 기록은 유지된다. 수확은 시즌이 끝난 뒤에도 할 수 있다.

지난 날의 출근을 본인이 추가하는 기능은 없다. 쿠폰이 걸려 있어 출근은 그날 직접 누른 것만 인정한다. 누르지 못한 날과 사이트가 열리기 전의 사전 기간(11-18\~11-20) 출근은 운영자가 확인한 뒤 Supabase 대시보드에서 넣는다(11.2).

### 2.8 위치 확인

출근과 퇴근은 그라운드 근처에서만 기록한다. 운영자가 대시보드에서 넣는 기록(11.2)은 위치를 보지 않는다.

| 상수 | 값 | 뜻 |
| --- | --- | --- |
| `CAMP.lat`, `CAMP.lng` | 37.5040, 127.1042 | 그라운드(교육장) 위치. 서울 송파구 백제고분로37길 22(도로 단위 좌표) |
| `CAMP.radiusM` | 500 | 허용 반경(m) |

1. 출근이나 퇴근 버튼을 누르면 브라우저가 `navigator.geolocation.getCurrentPosition`으로 지금 위치를 구한다. 높은 정확도, 제한 시간 10초, 저장된 위치를 쓰지 않는다(`maximumAge: 0`)
2. 위도와 경도를 서버 액션에 넘긴다. 서버는 그라운드까지의 거리(하버사인 공식, 지구 반지름 6,371,000m)를 계산해 `radiusM`보다 멀면 거절한다
3. 위치는 저장하지 않는다. 판정에만 쓰고 버린다
4. 위치를 구하지 못하면(권한 거부, 시간 초과, 지원하지 않는 브라우저) 기록하지 않고 안내만 한다. 누르지 못한 날은 운영자가 넣는다(11.2)

위치는 브라우저가 보내는 값이라 위조할 수 있다. 쿠폰이 걸린 만큼 가벼운 확인으로 보고, 운영자는 과수원 화면과 대시보드로 이상한 기록을 살핀다.

| 상황 | 토스트(negative, 실패 안내는 normal) |
| --- | --- |
| 위치를 구하는 중 | 버튼을 `loading`으로 둔다. 토스트 없음 |
| 위치 권한이 없다 | 위치 권한을 허용해야 출근과 퇴근을 기록할 수 있어요. 브라우저 설정에서 위치를 허용해 주세요. |
| 위치를 구하지 못했다 | 지금 위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요. |
| 반경 밖이다 | 그라운드에서 {거리}m 떨어져 있어요. 그라운드 500m 안에서 기록할 수 있어요. ({거리}는 10m 단위로 반올림, 1,000m 이상은 "{n.n}km") |

## 3. 화면 명세

화면은 로그인, 가입, 홈, 캘린더, 모두의 과수원 5개와 내 설정, 수확 카드 모달 2개다. 모양과 동작의 기준은 [열매 출근부 예시 사이트](https://claude.ai/artifact/VMePm6xLE98gMfKFcMxCT4)이고, 이 장의 수치와 문구가 그 사이트와 같다.

### 3.1 화면 목록과 이동

| 경로 | 화면 | 로그인 필요 | 예시 사이트 주소 |
| --- | --- | --- | --- |
| `/login` | 로그인 | 아니오 | `#login` |
| `/signup` | 가입 | 아니오 | `#signup` |
| `/` | 홈 (내 나무) | 예 | `#home` |
| `/calendar` | 캘린더 | 예 | `#calendar` |
| `/garden` | 모두의 과수원 | 예 | `#garden` |

로그인하지 않고 보호 화면에 오면 `/login`으로 보낸다. 로그인한 채 `/login`이나 `/signup`에 오면 `/`로 보낸다.

예시 사이트에만 있고 정식 구현에는 넣지 않는 것은 다음과 같다.

- 맨 위 "예시 화면" 바와 날짜 이동 버튼, "처음 상태로" 버튼
- 로그인 화면의 "예시 사이트예요" 안내와 "예시 계정으로 둘러보기" 버튼
- 비밀번호를 확인하지 않는 로그인
- 가상 구성원 13명과 브라우저 저장소에 기록을 두는 방식

### 3.2 공통 레이아웃

| 요소 | 명세 |
| --- | --- |
| 페이지 배경 | `semantic.background.neutral.secondary` |
| 컨테이너 | `containerStyle()`. 768px 이상은 폭 90%, 최대 1060px. 미만은 좌우 여백 20px |
| 본문 여백 | 위 24px(모바일 16px), 아래 96px(모바일은 3.10) |
| 패널 | 배경 `semantic.background.neutral.primary`, 테두리 1px `semantic.line.neutral.secondary`, 모서리 20px(모바일 16px), 안쪽 여백 24px(모바일 20px) |
| 헤더 | 화면 위 고정, 최소 높이 56px, 배경 `background.neutral.primary` 88% + blur 32px, 아래 1px `line.neutral.tertiary` |
| 헤더 왼쪽 | 브랜드 마크 32px + "커리어캠프 출근부"(headline2, 굵기 700). 누르면 홈 |
| 헤더 탭 | 768px 이상에서만. 브랜드에서 32px 띄우고 `Tab` small 3개: "내 나무", "캘린더", "모두의 과수원". 밑줄이 헤더 아래 선에 닿는다 |
| 헤더 오른쪽 | `TextButton` assistive small(IconPerson 18px + "{이름}님", 누르면 내 설정) + `Button` outlined assistive small "로그아웃". 간격 12px. 768px 미만은 이름이 길면 브랜드와 겹치므로 "{이름}님" 대신 `IconButton`(IconPerson, "내 설정 열기")만 둔다 |
| 하단 탭 바 | 768px 미만에서만. `BottomNavigation` 높이 56px에 아래 안전 영역을 더한다. 항목은 IconHome "내 나무", IconCalendar "캘린더", IconPersons "과수원". 현재 화면은 브랜드색, 나머지는 `foreground.inactive.primary` |
| 로그인·가입 화면 | 헤더에 브랜드만 보이고 하단 탭 바는 없다 |
| 브레이크포인트 | 몽타주 값 그대로 sm 768px, md 992px |
| 줄바꿈 | 모든 글자는 어절(띄어쓰기) 단위로 줄을 바꾼다(`word-break: keep-all`). 이메일처럼 띄어쓰기 없이 긴 글자만 칸을 넘을 때 글자 단위로 끊는다(`overflow-wrap: anywhere`) |

### 3.3 로그인 (`/login`)

최대 폭 420px 패널을 가운데 두고 위에 24px를 띄운다. 요소는 위에서부터 다음 순서다.

1. 제목 "로그인" (title3 bold)
2. 설명 "출근한 날만큼 나무가 자라고, 20일을 채우면 열매가 열려요." (body1-reading, secondary). 아래 24px
3. 폼(항목 간격 16px): 이메일(placeholder `name@example.com`), 비밀번호(placeholder "비밀번호"), `Button` solid primary large 전체 폭 "로그인"
4. 아래 20px 띄우고 가운데 정렬 "처음이라면 가입하기". "가입하기"만 브랜드색 굵은 링크

| 검사 | 오류 문구 | 표시 위치 |
| --- | --- | --- |
| 이메일 형식이 아니다 | 이메일 형식을 확인해 주세요. | 이메일 아래 |
| 비밀번호가 비었다 | 비밀번호를 입력해 주세요. | 비밀번호 아래 |
| 계정이 없거나 비밀번호가 틀리다 | 이메일 또는 비밀번호가 맞지 않아요. | 비밀번호 아래 |

### 3.4 가입 (`/signup`)

로그인과 같은 패널이다. 제목 "가입하기", 설명 "씨앗을 하나 골라 심어요. 출근한 날만큼 자라요.", 버튼 "가입하고 씨앗 심기", 맨 아래 "이미 가입했다면 로그인".

| 항목 | placeholder | 검사 | 오류 문구 |
| --- | --- | --- | --- |
| 이름 | 캠프에서 쓰는 이름 | 공백 제외 2\~20자 | 이름을 2자 이상 입력해 주세요. |
| 이메일 | name@example.com | 이메일 형식 | 이메일 형식을 확인해 주세요. |
| 이메일 |  | 이미 가입한 주소 | 이미 가입한 이메일이에요. 로그인해 주세요. |
| 비밀번호 | 8자 이상 | 8자 이상 | 비밀번호는 8자 이상이어야 해요. |
| 씨앗 |  | 넷 중 하나 선택 | 씨앗을 하나 골라 주세요. |
| 출근 플랜 |  | 셋 중 하나 선택 | 출근 플랜을 하나 골라 주세요. |

씨앗은 4열 격자(간격 8px)로 놓은 선택 상자 4개다. 각 상자는 `framedStyle({ size: 'large' })`에 안쪽 여백을 위 12px, 좌우 4px, 아래 10px로 주고, 열매 그림(폭 36px, 4.4)과 씨앗 이름(label1 bold)을 세로로 가운데 정렬한다. 그룹 아래 도움말은 "20일을 출근하면 이 열매가 열려요."다.

출근 플랜은 세로로 쌓은 선택 상자 3개다. 각 상자는 `framedStyle({ size: 'large' })`에 위아래 여백 14px를 주고, 왼쪽에 이름(body1 bold)과 설명(label1 regular, tertiary), 오른쪽에 `Radio` small을 둔다. 상자 사이는 8px다. 설명은 "{플랜 설명} 주간 목표는 {goal}일이에요."이고, 그룹 아래 도움말은 "나중에 내 설정에서 바꿀 수 있어요."다.

오류는 항목마다 아래에 `FormControlNegativeMessage`로 보이고, 첫 오류 항목에 포커스를 준다. 가입에 성공하면 로그인된 상태로 `/`에 가고 토스트 "{이름}님, {씨앗 이름} 씨앗을 심었어요."를 띄운다. 시즌이 끝난 뒤에는 폼 대신 "12월 25일로 시즌이 끝나 새로 가입할 수 없어요."와 로그인 링크만 보인다.

### 3.5 홈 (`/`)

992px 이상은 2단이다. 왼쪽 단은 폭 340px 고정, 오른쪽 단이 나머지를 쓰고, 단과 패널 사이는 24px다. 992px 미만은 1단이고 패널 사이는 16px다.

```
992px 이상                              992px 미만
+-----------+------------------------+   +----------------+
| 오늘      | 내 나무                |   | 오늘           |
+-----------+                        |   +----------------+
| 이번 주   +------------------------+   | 내 나무        |
|           | 오늘 그라운드              |   +----------------+
+-----------+------------------------+   | 이번 주        |
                                         +----------------+
                                         | 오늘 그라운드      |
                                         +----------------+
```

**오늘 패널**

1. 제목 "안녕하세요, {이름}님" (heading2 bold)
2. 날짜 "{M}월 {D}일 {요일}요일" (label1, tertiary) + 상태 배지(`ContentBadge` small). 간격 8px, 제목에서 4px 아래
3. 주 버튼(`Button` large, 전체 폭). 위 20px. 768px 미만에서는 여기서 빼고 화면 아래에 고정한다(3.10)
4. 도움말 (label2, tertiary). 위 10px
5. 위 20px 띄우고 1px `line.neutral.tertiary` 선, 그 아래 20px에 2칸: "출근 시간", "퇴근 시간" 라벨(label2, tertiary)과 값(heading2 bold). 값은 `HH:MM` 24시간제이고 없으면 "미기록"(quaternary)

| 상태 | 조건 | 배지 | 주 버튼 | 도움말 |
| --- | --- | --- | --- | --- |
| 출근 전 | 출근일, 오늘 기록 없음 | 출근 전 (neutral) | 출근하기 (solid primary) | 출근하면 나무가 자라요. |
| 그라운드에 있음 | 출근 시각 있음, 퇴근 시각 없음 | 그라운드에 있어요 (accent lime) | 퇴근하기 (solid assistive) | 퇴근은 누르지 않아도 출근 기록은 그대로예요. |
| 퇴근함 | 퇴근 시각 있음 | 퇴근했어요 (neutral) | 퇴근 시간 다시 기록 (outlined assistive) | 오늘 출근을 기록했어요. |
| 쉬는 날 | 시즌 종료 전, 출근일 아님 | 쉬는 날 (neutral) | 오늘은 쉬는 날이에요 (비활성) | 주말과 공휴일에는 출근을 기록하지 않아요. 다음 출근일은 {M}월 {D}일 {요일}요일이에요. |
| 시즌 종료 | 오늘이 12-25 뒤 | 시즌 종료 (neutral) | 시즌이 끝났어요 (비활성) | 11월 18일부터 12월 25일까지의 기록은 캘린더에서 볼 수 있어요. |

쉬는 날 도움말의 둘째 문장은 남은 출근일이 없으면 뺀다. 11-18 이전 날짜도 쉬는 날 상태로 보인다.

**이번 주 패널**

1. 머리줄: 왼쪽에 제목 "이번 주"(headline2 bold, 시즌 종료 뒤에는 "마지막 주")와 플랜 배지(`ContentBadge` small neutral)를 8px 간격으로. 달성했으면 오른쪽에 `ContentBadge` "목표 달성"(accent violet)
2. 요일 5칸(월\~금, 5열 균등, 위 16px). 칸마다 세로로 요일 글자(caption1 medium, tertiary), 지름 36px 원, 날짜 숫자(caption1, quaternary). 간격 6px
3. 문장 (label1-reading, secondary). 위 16px
4. `streak`이 1 이상일 때만: 위 12px에 1px 선, 그 아래 12px에 IconFireFill 18px(`foreground.cautionary.primary`) + "{n}주 연속으로 목표를 채웠어요"(label1 bold)

| 원 상태 | 조건 | 원 모양 | 원 안 |
| --- | --- | --- | --- |
| 출근함 | 그날 기록 있음 | `surface.accent.violetOpaque`로 채움 | IconCheckThick 18px 흰색 |
| 오늘 | 오늘이고 기록 없음, 시즌 종료 전 | `surface.accent.violet` + 안쪽 2px `line.accent.violet` | "오늘"(caption1 bold, `foreground.accent.violet`). 요일과 숫자는 primary bold |
| 빈 날 | 출근일인데 기록 없음 | `surface.neutral.tertiary` + 안쪽 1.5px `line.neutral.primary` | 없음 |
| 출근일 아님 | 그 주 `days(w)`에 없는 날 | 배경과 테두리 없음 | "–" |

문장은 아래 순서로 처음 맞는 것을 쓴다. `need`는 `goal - count`, `left`는 이번 주 `days(w)` 중 오늘 뒤의 날 수에 오늘 기록이 없으면 1을 더한 값이다.

| 순서 | 조건 | 문장 |
| --- | --- | --- |
| 1 | 정식 시작 전 | 정식 시작은 11월 23일 월요일이에요. 주간 목표는 그때부터 세요. |
| 2 | 시즌 종료 뒤, 달성 | 마지막 주 목표 {goal}일을 채웠어요. |
| 3 | 시즌 종료 뒤, 미달성 | 마지막 주에는 {count}일 출근했어요. |
| 4 | `weekGoal`이 0 | 이번 주에는 출근할 수 있는 날이 없어요. |
| 5 | count가 goal보다 크다 | 이번 주 {count}일 출근했어요. 목표 {goal}일을 넘겼어요. |
| 6 | count가 goal과 같다 | 이번 주 목표 {goal}일을 채웠어요. |
| 7 | need가 left보다 크다 | 이번 주 목표는 놓쳤어요. 그래도 나온 날만큼 나무는 자라요. |
| 8 | count가 0 | 이번 주 목표는 {goal}일이에요. 아직 출근한 날이 없어요. |
| 9 | 그 밖 | 이번 주 {count}일 출근했어요. {need}일 더 나오면 목표 {goal}일을 채워요. |

정식 시작 전(오늘이 11-23 이전)에는 요일 원이 그 주의 출근일인 11-18, 11-19, 11-20만 쓸 수 있는 날로 보이고 월요일과 화요일은 "–"다. 목표 달성 배지와 연속 달성은 보이지 않는다. 원 상태는 표의 위에서부터 판정하므로, 기록이 있는 날은 `days(w)`에 없어도 출근함으로 보인다.

**내 나무 패널**

1. 머리줄: 제목 "내 나무"(headline2 bold) + 오른쪽 `ContentBadge` medium neutral "{씨앗 이름}"
2. 문장 (heading1 bold, 위 8px). 아래 첫 표
3. 본문(위 12px): 왼쪽에 나무 그림(폭 240px, 4장), 오른쪽에 안내. 간격 24px, 안내는 위 28px를 띄운다. 768px 미만은 세로로 쌓고 그림을 폭 220px로 가운데 둔다

| 조건 | 문장 |
| --- | --- |
| 수확 완료 | {열매 이름}{을/를} 수확했어요 |
| 수확 가능 | 열매가 열렸어요 |
| 총 출근 0일 | 씨앗을 심었어요 |
| 그 밖 | 열매까지 {20 - days}일 남았어요 |

안내는 body2-reading, secondary이고 항목 사이는 16px다. 위에서부터 다음 순서다.

| 순서 | 조건 | 내용 |
| --- | --- | --- |
| 1 | 수확 완료 | "수확 카드를 운영진에게 DM으로 보내면 커피 쿠폰으로 바꿔 드려요."와 `Button` outlined assistive medium "수확 카드 보기" |
| 1 | 수확 가능 | `SectionMessage` positive. 제목 "수확할 수 있어요", 설명 "나무의 열매를 눌러 수확하세요. 커피 쿠폰으로 바꿀 수 있는 수확 카드가 나와요." |
| 1 | 그 밖 | 현재 문장과 다음 단계 문장을 한 문단으로 |
| 2 | 수확 전, 시즌 중, `days + 남은 출근일`이 20 미만 | 남은 출근일을 모두 나와도 열매까지는 {모자란 일수}일이 모자라요. 그래도 나무는 계속 자라요. (tertiary) |
| 3 | 항상 | 성장 트랙 |
| 4 | 수확 전이고 20일 미만 | 열매는 출근 20일에 열리고, 수확하면 커피 쿠폰으로 바꿀 수 있어요. (tertiary) |

현재 문장은 0일이면 "아직 출근한 날이 없어요.", 아니면 "지금까지 {days}일 출근했고, 지금은 {단계} 단계예요."다. 다음 단계 문장은 아래와 같고 n은 다음 단계까지 남은 일수다.

| 다음 단계 | 문장 |
| --- | --- |
| 새싹 | 하루 나오면 새싹이 나요. |
| 묘목 | {n}일 더 나오면 묘목으로 자라요. |
| 나무 | {n}일 더 나오면 나무가 돼요. |
| 꽃 | {n}일 더 나오면 꽃이 펴요. |
| 열매 | {n}일 더 나오면 열매가 열려요. |
| 시즌 종료 뒤 | 12월 25일로 시즌이 끝났어요. |

성장 트랙은 열매까지의 길을 보여 주는 가로 막대다. 폭은 안내 영역 전체에서 좌우 14px를 뺀 만큼이다.

- 막대: 높이 8px, 양 끝 둥글게, 배경 `surface.neutral.strong`. 왼쪽부터 `min(days, 20) / 20`만큼 잎색(4.5)으로 채운다
- 점: 1일, 5일, 10일, 15일, 20일 위치(일수 / 20)에 지름 12px 원. 도달 전은 패널 배경색에 안쪽 2px `line.neutral.primary`, 도달 후는 짙은 잎색
- 라벨: 점 아래 8px에 단계 이름(caption1 medium, tertiary)과 "{n}일"(caption2, quaternary)을 점 가운데에 맞춰 세로로. 도달한 단계 이름은 primary bold
- 읽을 수 있는 이름: "열매까지 20일 중 {n}일"

**오늘 그라운드 패널**

제목 "오늘 그라운드"(headline2 bold), 문장(body2, secondary, 위 8px), 이름 칩 목록(위 12px, 간격 6px), `TextButton` primary small "모두의 과수원 보기"(위 12px, `/garden`으로 이동) 순서다.

| 조건 | 문장 |
| --- | --- |
| 시즌 종료 | 시즌이 끝나서 오늘 출근 기록은 없어요. |
| 출근일 아님 | 오늘은 쉬는 날이라 출근 기록이 없어요. |
| 오늘 출근 0명 | 아직 아무도 출근하지 않았어요. 오늘 첫 출근을 기록해 보세요. |
| 그 밖 | 오늘 {출근 인원}명이 출근했고, 지금 {퇴근 전 인원}명이 그라운드에 있어요. |

칩은 오늘 출근한 사람 전원을 출근 시각이 빠른 순으로 보인다. `ContentBadge` medium outlined에 이름을 쓰고, 아직 퇴근하지 않은 사람은 이름 앞에 지름 6px 점(`foreground.accent.lime`)을 붙인다.

### 3.6 캘린더 (`/calendar`)

패널 하나에 머리줄, 달력, 기록 표가 차례로 들어간다. 기록을 보기만 하는 화면이고 여기서 출근을 추가하거나 고칠 수 없다.

- 머리줄: 왼쪽 제목 "출근 캘린더"(heading2 bold). 오른쪽에 `IconButton`(IconChevronLeft, "이전 달"), "{YYYY}년 {M}월"(headline2 bold, 가운데 정렬, 최소 폭 7.5em), `IconButton`(IconChevronRight, "다음 달")
- 볼 수 있는 달은 2026년 11월과 12월뿐이고 끝에서는 화살표가 비활성이다. 처음에는 오늘이 속한 달을, 범위 밖이면 12월을 연다
- 달력: 7열, 칸 간격 8px(모바일 4px), 위 20px. 첫 줄은 "일 월 화 수 목 금 토"(label2 medium, tertiary, 가운데)
- 칸: 최소 높이 88px(모바일 56px), 모서리 12px(모바일 10px), 안쪽 여백 10px(모바일 6px 4px), 안쪽 1px `line.neutral.secondary`. 날짜 숫자는 label1 medium

| 칸 종류 | 조건 | 모양 | 칸 안 내용 |
| --- | --- | --- | --- |
| 출근일 아님 | 주말, 공휴일, 시즌 밖 | 배경 `surface.neutral.tertiary`, 테두리 없음, 숫자 quaternary | 공휴일이면 이름(caption1, tertiary) |
| 오늘 | 날짜가 오늘 | 안쪽 2px `line.brand.strong` | 출근일이고 기록이 없으면 "오늘"(caption1, tertiary) |
| 출근함 | 기록 있음 | 기본 | 지름 14px 잎색 원 + "HH:MM \~ HH:MM"(caption1, secondary). 퇴근이 없으면 "HH:MM \~", 출근 시각이 없는 기록은 원만 |
| 그 밖 |  | 기본 | 숫자만 |

768px 미만에서는 시간 글자를 화면에서만 숨기고 스크린리더에는 남긴다. 잎색 원만 보인다.

기록 표는 달력 아래 24px에 `Table`로 두고, 보고 있는 달의 기록을 최신 날짜부터 보인다. 좁은 화면에서는 표만 가로로 스크롤한다.

| 열 | 값 |
| --- | --- |
| 날짜 | "12월 1일 화요일" 형식 |
| 출근 | `HH:MM`, 없으면 "–" |
| 퇴근 | `HH:MM`, 없으면 "–" |
| 머문 시간 | "9시간 7분" 형식. 1시간 미만은 "42분". 출근이나 퇴근이 없거나 차이가 0 이하면 "–" |

그 달에 기록이 없으면 표 대신 가운데 정렬 문장 "이 달에는 아직 출근 기록이 없어요. 출근하면 여기에 쌓여요."(body2, tertiary, 여백 32px 20px)를 보인다.

### 3.7 모두의 과수원 (`/garden`)

제목 "모두의 과수원"(title3 bold), 한 문단 요약(body1-reading, secondary, 위 8px, 최대 폭 38em), 구성원 카드 목록(위 24px) 순서다. 카드 목록은 992px 이상 3열, 600\~991px 2열, 600px 미만 1열이고 간격은 16px다.

| 조건 | 요약 문장 |
| --- | --- |
| 출근일 | 오늘 {전체 인원}명 중 {출근 인원}명이 출근했어요. {수확 문장} |
| 쉬는 날 | 오늘은 쉬는 날이에요. {수확 문장} |
| 시즌 종료 | 시즌이 끝났어요. {수확 문장} |

수확 문장은 수확한 사람이 있으면 "지금까지 {n}명이 열매를 수확했어요.", 없으면 "아직 열매를 수확한 사람은 없어요."다.

카드는 안쪽 여백 20px 패널이고, 왼쪽 정보와 오른쪽 미니 나무(폭 72px, 4.6)를 16px 간격으로 둔다. 왼쪽 정보는 위에서부터 8px 간격으로 다음과 같다.

1. 이름(headline2 bold). 본인 카드에는 `ContentBadge` "나"(accent, 브랜드색)
2. 배지 줄(간격 4px): 플랜 이름(neutral). 수확했으면 "수확 완료"(accent violet). 오늘 출근했으면 "그라운드에 있어요"(accent lime) 또는 "퇴근했어요"(neutral)
3. "출근 {days}일, {단계} 단계". 수확했으면 "출근 {days}일, 수확 완료" (label1, secondary)
4. `streak`이 1 이상이면 IconFireFill 14px + "{n}주 연속 달성" (label2, tertiary)

정렬은 본인 카드가 맨 앞, 다음은 오늘 출근한 사람을 출근 시각이 빠른 순으로, 나머지는 이름 가나다순이다. 다른 사람의 출근·퇴근 시각은 어디에도 표시하지 않는다. 수확 여부는 모두에게 보이므로, 운영진은 수확 카드를 받으면 이 화면의 "수확 완료" 배지와 맞춰 본다.

### 3.8 내 설정 (모달)

헤더의 "{이름}님"을 누르면 열린다. 768px 이상은 폭 480px, 모서리 24px 팝업이고 미만은 아래에서 올라오는 시트다.

1. 머리줄: 제목 "내 설정"(heading2 bold), 오른쪽 닫기 `IconButton`(IconClose, "닫기")
2. 이름 입력(현재 이름이 들어 있고 열릴 때 포커스)
3. 씨앗 선택(3.4와 같은 격자, 현재 씨앗이 선택됨). 도움말은 "씨앗을 바꿔도 자란 만큼은 그대로예요." 수확한 뒤에는 고를 수 없게 막고 도움말을 "수확한 뒤에는 씨앗을 바꿀 수 없어요."로 바꾼다
4. 출근 플랜 선택(3.4와 같은 상자 3개, 현재 플랜이 선택됨). 도움말 "플랜을 바꾸면 주간 목표가 새 플랜 기준으로 다시 계산돼요. 나무는 그대로예요."
5. 버튼 2개를 같은 폭으로, 간격 8px: "취소"(solid assistive large), "저장하기"(solid primary large)

도움말은 caption1, tertiary다. 저장하면 모달을 닫고 토스트 "설정을 저장했어요."를 띄운다. Esc, 바깥 영역 클릭, 닫기 버튼은 모두 취소다. 이름 검사와 오류 문구는 가입과 같다.

### 3.9 수확과 수확 카드

열매를 직접 눌러 수확하고, 그 자리에서 운영진에게 보낼 수확 카드 이미지를 받는 흐름이다.

1. 총 출근 20일이 되는 출근을 누르면 나무에 열매가 열리고 토스트 "열매가 열렸어요. 나무의 열매를 눌러 수확하세요."가 뜬다. 열매 둘레에는 고리가 퍼지는 모션이 반복된다(4.6)
2. 열매를 누르면 확인 없이 바로 수확된다. 키보드로는 열매에 포커스를 두고 Enter나 Space를 누른다
3. 수확하면 열매가 나무 아래 바구니로 옮겨지고 수확 카드 모달이 열린다
4. 모달을 닫은 뒤에는 내 나무 패널의 "수확 카드 보기"로 언제든 다시 연다

수확 카드 모달은 3.8과 같은 크기와 동작이다. 위에서부터 제목 "수확 카드"와 닫기 버튼, 카드 이미지(폭은 최대 360px, 모서리 16px, 가운데), 안내 "이 이미지를 복사해 운영진에게 DM으로 보내면 커피 쿠폰으로 바꿔 드려요."(label1-reading, secondary, 가운데), 같은 폭 버튼 2개다.

| 버튼 | 동작 | 성공 토스트 | 실패했을 때 토스트 |
| --- | --- | --- | --- |
| 이미지 복사 (solid primary large) | 카드 PNG를 클립보드에 넣는다. `navigator.clipboard.write`와 `ClipboardItem`을 쓴다 | 이미지를 복사했어요. DM에 붙여 넣으세요. | 여기서는 바로 복사할 수 없어요. 이미지를 길게 누르거나 오른쪽 버튼으로 복사해 주세요. |
| 이미지 저장 (solid assistive large) | `harvest-{수확 날짜}.png`로 내려받는다 | 없음 | 저장하지 못했어요. 이미지를 길게 눌러 저장해 주세요. |

카드는 `<img>`로 보여서, 버튼이 동작하지 않는 환경에서도 길게 누르거나 오른쪽 버튼으로 복사하고 저장할 수 있어야 한다. 대체 텍스트는 "{이름}님의 수확 카드. {열매 이름}, 총 출근 {days}일, 출근 플랜 {플랜 이름}, 수확한 날 {M}월 {D}일."이다. 카드에 담는 내용과 그리는 법은 4.7에 있다.

### 3.10 모바일

768px 미만은 한 손으로 쓰는 스마트폰 화면으로 보고 아래처럼 배치한다. 폭 360px에서 430px 사이를 기준으로 확인한다.

| 요소 | 모바일 배치 |
| --- | --- |
| 화면 이동 | 헤더의 탭을 숨기고 하단 탭 바(3.2)를 쓴다 |
| 출근 버튼 | 홈의 주 버튼을 하단 탭 바 바로 위에 고정한다. 좌우 20px, 위 16px, 아래 12px 여백. 배경은 아래쪽 72%까지 페이지 배경색이고 그 위로 투명해진다. 상태와 문구는 3.5와 같고 비활성 상태도 같은 자리에 보인다 |
| 본문 아래 여백 | 하단 탭 바만 있는 화면은 88px, 홈은 164px. 둘 다 아래 안전 영역을 더한다 |
| 토스트 | 하단 탭 바와 고정 버튼 위에 뜬다. 아래에서 72px, 홈은 148px에 안전 영역을 더한 위치 |
| 모달 | 내 설정과 수확 카드는 아래에서 올라오는 시트. 내용이 길면 시트 안에서 스크롤한다 |
| 터치 영역 | 누르는 요소는 44px 이상. 나무의 열매는 보이는 크기와 상관없이 지름 64px 영역을 받는다 |
| 안전 영역 | `viewport-fit=cover`를 쓰고 헤더 위와 하단 탭 바 아래에 `env(safe-area-inset-*)`만큼 여백을 준다 |
| 가로 넘침 | 폭 360px에서 가로 스크롤이 없어야 한다. 캘린더의 기록 표만 표 안쪽에서 스크롤한다 |
| 홈 화면에 추가 | `app/manifest.ts`로 웹 앱 매니페스트를 낸다. 이름 "커리어캠프 출근부", 짧은 이름 "커리어캠프", `display: 'standalone'`, 192px와 512px 아이콘(브랜드 마크). 설치 안내 화면은 만들지 않는다 |

### 3.11 접근성과 반응

- 모든 동작은 키보드로 할 수 있고 포커스 표시가 보인다
- 폼 오류가 나면 첫 오류 항목에 포커스를 주고 화면 가운데로 스크롤해 고정 헤더에 가리지 않게 한다
- 출근과 퇴근 뒤에도 포커스는 주 버튼에 남는다
- 색만으로 뜻을 전하지 않는다. 출근한 날은 체크 표시, 오늘은 "오늘" 글자, 수확은 "수확 완료" 글자가 함께 있다
- 그림에는 읽을 수 있는 이름을 준다. 요일 칸 "목요일 17일, 출근함", 나무 "내 사과나무. 출근 19일, 꽃 단계.", 열매 버튼 "사과 수확하기"
- 운영체제의 "동작 줄이기" 설정이 켜져 있으면 잎·꽃·열매가 생기는 모션과 토스트 모션을 끄고, 열매 둘레의 고리는 움직이지 않는 고리로 보인다

## 4. 나무와 수확 카드 시각 명세

나무는 씨앗 종류와 총 출근 일수만으로 모양이 정해지는 SVG 한 장이다. 직접 그리는 컴포넌트(`components/TreeFigure.tsx`)이고 좌표와 도형은 `lib/tree.ts`에 둔다. 디자이너 시안이 올라오면 이 장의 그림이 가장 먼저 바뀌므로, 그림 코드는 규칙 코드와 섞지 않는다.

### 4.1 캔버스와 공통 수치

| 이름 | 값 |
| --- | --- |
| viewBox | `0 0 240 260` |
| 땅 기준점 | `GX = 120`, `GY = 232` |
| n | `min(days, 20)`. 20일을 넘으면 모양이 더 변하지 않는다 |
| 줄기 높이 H | n이 0이면 0, 아니면 `16 + n * 5.2` |
| 줄기 꼭대기 | `topY = GY - H` |
| 잎 덩어리 중심 | `cy = topY - 4` |
| 줄기 굵기 | `3 + n * 0.55` |

검산값은 n이 1일 때 H 21.2, 5일 때 42, 10일 때 68, 15일 때 94, 20일 때 120이다.

### 4.2 그리는 순서

아래 순서로 겹쳐 그린다.

| 순서 | 조건 | 요소 | 그리는 법 |
| --- | --- | --- | --- |
| 1 | 항상 | 흙 | 타원. 중심 (120, 236), rx 72, ry 12. 흙색 |
| 2 | 0일 | 씨앗 | 타원. 중심 (120, 226), rx 9, ry 6.5, -20도 회전. 씨앗색. 그 위에 흙색 둔덕 `M100 235 Q120 227 140 235 Z`를 덮는다 |
| 3 | 1일 이상 | 줄기 | (120, 232)에서 (120, topY)까지 직선. 끝을 둥글게. n이 5 미만이면 짙은 잎색, 5 이상이면 줄기색 |
| 4 | 1\~9일 | 잎 n장 | 아래 "잎" 문단 |
| 5 | 10일 이상 | 잎 덩어리 `n - 7`개 | 아래 표의 앞에서부터. 원 중심 (120 + dx, cy + dy), 반지름 r. 0부터 세어 짝수 번째는 잎색, 홀수 번째는 짙은 잎색 |
| 6 | 15\~19일 | 꽃 `n - 14`송이 | (cy 기준) (-25, -7), (23, -21), (2, 16), (-9, -39), (44, -5)의 앞에서부터. 한 송이는 중심에서 4.2 떨어진 곳에 72도 간격으로 반지름 3.2 꽃잎 원 5개, 가운데 반지름 2.2 원(#FFC06E) |
| 7 | 20일 이상, 수확 전 | 열매 1개 | 중심 (150, cy + 28). 4.4의 열매 도형 r 18. 열매 뒤에 고리 원 r 28과 투명한 터치 영역 원 r 32 |
| 8 | 수확 완료 | 바구니 | 기준점 (172, 228). 손잡이 `M-13 -8 Q0 -32 13 -8`(줄기색 선 2.5), 열매 도형 r 9를 (0, -11)에, 그 앞에 몸통 `M-17 -8 H17 L13 10 H-13 Z`(씨앗색 채움, 줄기색 선 1.5) |

잎(1\~9일)은 i번째 잎(1부터)을 다음처럼 놓는다. 홀수 번째는 오른쪽(side = 1), 짝수 번째는 왼쪽(side = -1)이다. 타원의 `rx = 10 + n * 0.6`, `ry = rx / 2`, 중심 `x = 120 + side * rx * 0.9`, `y = 232 - H * (1 - floor((i - 1) / 2) * 0.2) - 3`, 회전은 `-28 * side`도다. i가 3의 배수면 짙은 잎색, 아니면 잎색이다. 두 장씩 같은 높이에 마주 보고, 새 잎일수록 아래쪽에 난다.

| 잎 덩어리 순번 | dx | dy | r |
| --- | --- | --- | --- |
| 0 | 0 | 0 | 38 |
| 1 | -32 | 9 | 30 |
| 2 | 32 | 9 | 30 |
| 3 | -18 | -27 | 30 |
| 4 | 18 | -27 | 30 |
| 5 | -50 | -9 | 25 |
| 6 | 50 | -9 | 25 |
| 7 | 0 | -48 | 28 |
| 8 | -39 | -41 | 23 |
| 9 | 39 | -41 | 23 |
| 10 | -14 | 25 | 25 |
| 11 | 14 | 25 | 25 |
| 12 | 0 | -11 | 34 |

10일에는 덩어리 3개, 하루에 1개씩 늘어 20일에 13개가 된다. 수확 완료 상태는 덩어리 13개에 꽃과 열매 없이 바구니만 더한다.

### 4.3 열매 버튼

- 수확할 수 있을 때 나무의 열매가 곧 버튼이다. `role="button"`, `tabindex="0"`, 이름은 "{열매 이름} 수확하기"이고 클릭, Enter, Space로 수확한다
- 고리는 브랜드색 선 2로 그리고, 크기 0.7배·불투명도 0.9에서 1.35배·투명으로 1.6초 동안 퍼지기를 반복한다
- 포커스를 받으면 고리가 멈추고 선이 3으로 굵어진다
- 과수원의 미니 나무에서는 열매가 버튼이 아니고 고리도 없다

### 4.4 열매 도형 (`lib/tree.ts`)

열매는 반지름 r에 비례하는 도형 목록으로 만든다. 나무와 씨앗 선택의 SVG, 수확 카드의 캔버스가 같은 목록을 쓴다. 색은 테마가 바뀌어도 같다.

```ts
const n1 = (v: number) => +v.toFixed(1);
const FC = { apple: '#FF4242', tangerine: '#FF9200', peach: '#FF9B61', coffee: '#E52222',
             leaf: '#00BF40', stalk: '#9C5800', crease: '#F55A00', white: '#FFFFFF' };
export const BLOSSOM = { apple: '#FED3F7', tangerine: '#FFFFFF', peach: '#FF94ED', coffee: '#FFFFFF' };

type Shape = { d: string; fill?: string; stroke?: string; sw?: number; o?: number };

// 원이나 타원을 path 문자열로
const circ = (cx: number, cy: number, rx: number, ry = rx) =>
  `M${n1(cx - rx)} ${n1(cy)}a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(rx * 2)} 0a${n1(rx)} ${n1(ry)} 0 1 0 ${n1(-rx * 2)} 0Z`;

export function fruitShapes(seed: 'apple' | 'tangerine' | 'peach' | 'coffee', r: number): Shape[] {
  const hl = { d: circ(-r * .38, -r * .42, r * .24, r * .15), fill: FC.white, o: .32 };
  const stalk = { d: `M0 ${n1(-r * .8)}Q${n1(r * .05)} ${n1(-r * 1.15)} ${n1(r * .3)} ${n1(-r * 1.3)}`,
                  stroke: FC.stalk, sw: n1(Math.max(1.5, r * .12)) };
  const leaf = { d: `M${n1(r * .12)} ${n1(-r * 1.05)}Q${n1(r * .5)} ${n1(-r * 1.5)} ${n1(r * .95)} ${n1(-r * 1.15)}`
                  + `Q${n1(r * .55)} ${n1(-r * .8)} ${n1(r * .12)} ${n1(-r * 1.05)}Z`, fill: FC.leaf };
  if (seed === 'apple') return [stalk, leaf, { d: circ(0, 0, r), fill: FC.apple }, hl];
  if (seed === 'tangerine') return [leaf, { d: circ(0, 0, r, r * .9), fill: FC.tangerine },
                                    { d: circ(0, -r * .8, r * .15), fill: FC.leaf }, hl];
  if (seed === 'peach') return [stalk, leaf, { d: circ(0, 0, r), fill: FC.peach },
    { d: `M${n1(r * .05)} ${n1(-r * .92)}Q${n1(r * .5)} ${n1(-r * .1)} ${n1(r * .1)} ${n1(r * .92)}`,
      stroke: FC.crease, sw: n1(Math.max(1.2, r * .09)), o: .7 }, hl];
  const c = r * .54; // 커피 열매 3알
  return [stalk, leaf, { d: circ(-r * .5, -r * .05, c), fill: FC.coffee }, { d: circ(r * .5, -r * .05, c), fill: FC.coffee },
          { d: circ(0, r * .5, c), fill: FC.apple }, { d: circ(-r * .66, -r * .26, c * .3, c * .2), fill: FC.white, o: .32 }];
}
```

목록의 각 항목은 열매 중심을 원점으로 한 path다. `fill`이 있으면 채우고, `stroke`가 있으면 굵기 `sw`의 둥근 끝 선으로 그리며, `o`는 불투명도다. SVG에서는 `<path>`로, 캔버스에서는 `Path2D`로 같은 `d`를 그린다.

| 색 | 값 | 몽타주 atomic |
| --- | --- | --- |
| 사과, 커피 열매 아래 알 | #FF4242 | `red[50]` |
| 귤 | #FF9200 | `orange[50]` |
| 복숭아와 골 | #FF9B61, #F55A00 | `redOrange[70]`, `redOrange[48]` |
| 커피 열매 위 두 알 | #E52222 | `red[40]` |
| 열매의 잎, 꼭지 | #00BF40, #9C5800 | `green[50]`, `orange[30]` |
| 꽃잎 | 사과 #FED3F7, 복숭아 #FF94ED, 귤과 커피 #FFFFFF | `pink[90]`, `pink[70]`, `common[100]` |
| 꽃 가운데 | #FFC06E | `orange[70]` |

### 4.5 나무 색

| 요소 | 라이트 | 다크 | 몽타주 토큰 |
| --- | --- | --- | --- |
| 잎색 | #00BF40 | #1ED45A | `semantic.foreground.positive.primary` |
| 짙은 잎색, 어린 줄기 | #009632 | #00BF40 | `atomic.green[40]`, 다크는 `atomic.green[50]` |
| 줄기색 | #9C5800 | #D47800 | `atomic.orange[30]`, 다크는 `atomic.orange[40]` |
| 흙색 | #663A00 | #9C5800 | `atomic.orange[20]`, 다크는 `atomic.orange[30]` |
| 씨앗색, 바구니 | #D47800 | #FFA938 | `atomic.orange[40]`, 다크는 `atomic.orange[60]` |

semantic 토큰은 테마에 따라 저절로 바뀐다. atomic 값은 `html[data-theme='dark']` 선택자로 다크 값을 따로 지정한다. 헥스 값은 확인용이며 코드에는 토큰으로 쓴다. 4.4의 열매 색과 4.7의 카드 색만 예외로 고정값을 쓴다.

### 4.6 크기와 모션

| 쓰는 곳 | 크기 | 차이 |
| --- | --- | --- |
| 홈 내 나무 | 폭 240px, 모바일 220px. 비율을 지킨다 | 4.2 전체 |
| 과수원 카드(미니) | 폭 72px, 높이 78px | 열매가 버튼이 아니고 고리가 없다 |
| 씨앗 선택 | 열매 도형 r 15, viewBox `-20 -28 40 48`, 폭 36px | 열매만 |
| 브랜드 마크 | 유리 큐브 `public/brand/mark.svg`(배경 투명, 큐브에 맞춰 여백을 줄인 viewBox), 32px | 헤더 |
| 앱 아이콘 | 어두운 둥근 정사각형 위 유리 큐브 `public/brand/icon.svg` | 파비콘, 홈 화면 아이콘 192·512px |

출근으로 새로 생긴 요소 하나만 한 번 튀어 오른다. 1\~9일은 새 잎, 10\~14일은 새 잎 덩어리, 15\~19일은 새 꽃, 20일은 열매이고, 수확 직후에는 바구니다. 크기 0.3배·투명에서 60% 지점 1.12배·불투명을 거쳐 1배로, 450ms, `cubic-bezier(.34, 1.56, .64, 1)`이고 기준점은 그 요소의 중심이다. 페이지를 새로 열었을 때는 움직이지 않는다.

### 4.7 수확 카드 이미지 (`lib/card.ts`)

수확 카드는 브라우저에서 캔버스 2D로 그리는 PNG 한 장이다. 논리 크기 360 x 480에 2배 해상도(720 x 960px)로 그린다. 받는 사람의 화면과 상관없이 같아 보이도록 색은 라이트 값으로 고정하고, 글꼴은 Pretendard가 준비된 뒤(`document.fonts.ready`)에 그린다.

| 요소 | 위치(논리 px) | 스타일 |
| --- | --- | --- |
| 바탕 | 전체 | #EAEBEC |
| 카드 | (8, 8)에서 344 x 464, 모서리 20 | #FFFFFF |
| "커리어캠프 출근부" | 왼쪽 24, 기준선 40 | 15px 700, #171719 |
| "수확 카드" | 오른쪽 끝 336에 맞춤, 기준선 40 | 13px 500, 흐린 글자색 |
| 열매 바탕 원 | 중심 (180, 118), 반지름 54 | #F7F7F8 |
| 열매 | 중심 (180, 126), 4.4의 도형 r 30 |  |
| "{이름}님의 {열매 이름}" | 가운데, 기준선 214 | 22px 700, #171719 |
| "{days}일 출근해서 열매를 수확했어요" | 가운데, 기준선 238 | 14px 400, rgba(46,47,51,.88) |
| 정보 칸 4개 | 2열 2행. 첫 칸 왼쪽 위 (24, 258), 칸 150 x 56, 모서리 12, 가로 162, 세로 66 간격으로 반복 | 바탕 #F7F7F8 |
| 칸의 라벨과 값 | 칸 왼쪽에서 14. 라벨 기준선은 칸 위에서 22, 값은 43 | 라벨 12px 500 흐린 글자색, 값 16px 600 #171719 |
| "출근 기록 (11월 18일 \~ 12월 24일)" | 왼쪽 24, 기준선 410 | 12px 500, 흐린 글자색 |
| 출근 점 27개 | 첫 점 중심 (28, 428), 반지름 4, 중심 간격 10.4, 주가 바뀔 때마다 6을 더 띄운다 | 출근한 날은 #00BF40 채움, 아닌 날은 rgba(112,115,124,.22) 선 1.5 |
| "이 이미지를 운영진에게 DM으로 보내 주세요" | 가운데, 기준선 460 | 12px 400, 흐린 글자색 |

흐린 글자색은 rgba(55,56,60,.61)이다. 정보 칸은 순서대로 총 출근 "{days}일", 출근 플랜 "{플랜 이름}", 첫 출근 "{M}월 {D}일", 수확한 날 "{M}월 {D}일"이다. days와 출근 점은 카드를 여는 시점의 기록으로 그린다. 출근 점은 시즌의 출근일 27일을 날짜순으로 한 줄에 놓은 것이다.

## 5. 디자인 시스템: 몽타주

원티드의 디자인 시스템 몽타주(Montage) React 패키지 4.3.2를 그대로 설치해 쓴다. 색, 글자, 모서리는 몽타주 토큰만 쓰고, 화면 요소는 몽타주 컴포넌트가 있으면 반드시 그것을 쓴다. 직접 만드는 것은 나무 그림, 성장 트랙, 수확 카드 이미지, 캘린더 격자, 요일 원, 패널뿐이다.

### 5.1 패키지와 설정

| 패키지 | 버전 | 용도 |
| --- | --- | --- |
| [`@montage-ui/core`](https://github.com/wanteddev/montage-web/tree/main/packages/core) | 4.3.2 | 컴포넌트, 테마, 스타일 유틸 |
| `@montage-ui/icon` | 4.3.2 | 아이콘 |
| `@montage-ui/nextjs` | 4.3.2 | App Router용 스타일 주입 |

- 세 패키지는 같은 버전으로, `^` 없이 고정한다. 버전이 어긋나면 테마 컨텍스트가 둘 생겨 스타일이 깨진다
- 4.3.2의 peerDependencies는 React 18 또는 19, Next.js 13\~16이다
- 클라이언트 컴포넌트 `app/providers.tsx`에서 `ThemeProvider enableDarkMode`로 감싸고 그 안에 `AppRouterCacheProvider`를 둔다. `app/layout.tsx`는 `@montage-ui/core/global.css`를 불러오고 `<html lang="ko" suppressHydrationWarning>`을 쓴다
- 글꼴은 Pretendard다. core README가 안내하는 대로 jsDelivr의 pretendard v1.3.9 dynamic subset 스타일시트를 `<head>`에 넣는다
- 다크 모드는 `enableDarkMode`만 켜서 운영체제 설정을 따른다. 테마 전환 버튼은 만들지 않는다
- 토스트는 `ThemeProvider` 안에서 `useToast`로 바로 쓸 수 있다

공식 문서는 [montage.wanted.co.kr](https://montage.wanted.co.kr), 소스는 [wanteddev/montage-web](https://github.com/wanteddev/montage-web)(MIT)이다. 저장소의 몽타주 MCP 서버는 `@wantedlab.com` 계정이 있어야 쓸 수 있다. 쓸 수 없으면 설치된 패키지의 타입 정의와 저장소의 `docs/data/components/**/web.mdx` 예제를 보고 props를 확인하며, 추측으로 쓰지 않는다.

### 5.2 사용 규칙

몽타주 공식 가이드(`montage-react` 스킬)의 규칙을 따른다.

- 색은 `sx={theme => ({ color: theme.semantic.foreground.neutral.primary })}`처럼 theme 콜백으로 semantic 토큰을 읽는다. 헥스 값과 `var(--semantic-…)` 이름을 직접 쓰지 않는다. 4.4의 열매 색과 4.7의 카드 색만 예외다
- 투명도를 섞을 때는 `addOpacity(색, theme.opacity[N])`을 쓴다
- 글자는 `Typography`의 `variant`, `weight`, `color`로 지정한다. 스타일 안에서는 `typographyStyle`을 쓴다
- 간격은 spacing 토큰 대신 이 문서의 px 값을 그대로 쓴다
- 컴포넌트가 주는 props(size, variant, color)를 먼저 쓰고 `sx`는 모자랄 때만 쓴다
- 배치는 `FlexBox`, `Box`, `containerStyle()`로 한다
- 원티드 로고(`LogoWanted`, `IconSymbol`)와 캠프 공식 로고(AI Native Frontiers)는 쓰지 않는다. 공식 서비스로 보이지 않게 하기 위해서다. 로고는 직접 그린 유리 큐브(`design/handoff/2026-11-18-logo`)를 쓴다

### 5.3 컴포넌트 매핑

| 화면 요소 | 몽타주 컴포넌트 | 지정할 값 |
| --- | --- | --- |
| 출근·퇴근·로그인·가입·저장·이미지 복사 버튼 | `Button` | `size="large"`, `fullWidth`, 상태별 `variant`·`color`(3.5, 3.9), 처리 중 `loading` |
| 로그아웃, 수확 카드 보기 | `Button` | `variant="outlined"`, `color="assistive"`, `size="small"` 또는 `"medium"` |
| "{이름}님", "모두의 과수원 보기" | `TextButton` | `size="small"`, `color="assistive"` 또는 `"primary"`, 앞 아이콘은 `leadingContent` |
| 달 이동, 모달 닫기 | `IconButton` | 기본 variant, `aria-label` |
| 헤더 탭(768px 이상) | `Tab`, `TabList`, `TabListItem` | `TabList size="small"`. `value`는 경로, `onValueChange`에서 라우터 이동 |
| 하단 탭 바(768px 미만) | `BottomNavigation`, `BottomNavigationItem` | `value`는 경로, `label`과 `icon`, `onValueChange`에서 라우터 이동 |
| 입력 항목 | `FormControl`, `FormControlLabel`, `FormControlField`, `TextField`, `FormControlMessage`, `FormControlNegativeMessage` | `TextField size="large"`, 오류 시 `status="negative"` |
| 씨앗 선택, 플랜 선택 | `RadioGroup`, `Radio` + `framedStyle` | `framedStyle({ size: 'large', selected })`. 플랜은 `Radio size="small"`을 보이고 씨앗은 상자 테두리로만 선택을 보인다 |
| 상태·플랜·씨앗 배지, 이름 칩 | `ContentBadge` | 아래 5.4 |
| 기록 표 | `Table`, `TableHead`, `TableBody`, `TableRow`, `TableHeadCell`, `TableCell` | 기본값 |
| 토스트 | `useToast` | 성공은 `variant: 'positive'`, 복사·저장 실패 안내는 `'normal'`, 서버 실패는 `'negative'` |
| 내 설정, 수확 카드 | `Modal`, `ModalContainer`, `ModalNavigation`, `ModalContent`, `ActionArea`, `ActionAreaButton` | `ModalContainer variant="bottom" sm={{ variant: 'popup' }}` |
| 수확 가능 안내 | `SectionMessage` | `variant="positive"`, `description` |
| 불러오는 중 | `Skeleton` | 패널 모양에 맞춘 `rectangle` |
| 모든 글자 | `Typography` | 3장에 적은 variant와 weight |

아이콘은 `@montage-ui/icon`의 `IconPerson`, `IconCheckThick`, `IconFireFill`, `IconChevronLeft`, `IconChevronRight`, `IconClose`, `IconHome`, `IconCalendar`, `IconPersons`를 쓴다. 모바일의 고정 출근 버튼은 `Button`을 화면 아래에 고정한 영역에 넣어 만든다(3.10).

### 5.4 배지 색

| 배지 | `ContentBadge` 설정 |
| --- | --- |
| 출근 전, 퇴근했어요, 쉬는 날, 시즌 종료, 플랜 이름, 씨앗 이름 | `color="neutral"`, `variant="solid"` |
| 그라운드에 있어요 | `color="accent"`, `accentColor="semantic.foreground.accent.lime"` |
| 목표 달성, 수확 완료 | `color="accent"`, `accentColor="semantic.foreground.accent.violet"` |
| 나 | `color="accent"`, `accentColor="semantic.foreground.brand.primary"` |
| 오늘 그라운드의 이름 칩 | `color="neutral"`, `variant="outlined"`, `size="medium"` |

### 5.5 색의 역할

| 역할 | 토큰 | 라이트 | 다크 |
| --- | --- | --- | --- |
| 주 동작(버튼, 링크, 포커스, 열매 고리) | `semantic.surface.brand.primary`, `semantic.foreground.brand.primary` | #0066FF | #3385FF |
| 주간 목표 달성, 수확 완료 | `semantic.surface.accent.violetOpaque`, `semantic.foreground.accent.violet` | #6541F2, #5B37ED | #7D5EF7, #9E86FC |
| 나무와 성장(잎, 성장 트랙, 캘린더의 출근 표시) | `semantic.foreground.positive.primary` | #00BF40 | #1ED45A |
| 지금 그라운드에 있음 | `semantic.foreground.accent.lime` | #429E00 | #58CF04 |
| 연속 달성 불꽃 | `semantic.foreground.cautionary.primary` | #FF9200 | #FFA938 |
| 오류 | `semantic.foreground.negative.primary` | #FF4242 | #FF6363 |
| 페이지 배경 | `semantic.background.neutral.secondary` | #F7F7F8 | #0F0F10 |
| 패널 배경 | `semantic.background.neutral.primary` | #FFFFFF | #1B1C1E |
| 본문 글자 | `semantic.foreground.neutral.primary` | #171719 | #F7F7F8 |

파랑은 누를 수 있는 것, 초록은 나무가 자란 만큼, 보라는 달성과 수확, 연두는 지금 그라운드에 있음을 뜻한다. 이 역할을 섞어 쓰지 않는다.

## 6. 기술 스택과 구조

Next.js 16 App Router 앱을 Vercel에 올리고, 가입·로그인과 데이터베이스는 Supabase를 쓴다. 브라우저는 데이터를 직접 쓰지 못하고, 모든 쓰기는 서버 액션이 규칙을 검사한 뒤에 한다.

### 6.1 스택

| 영역 | 선택 | 메모 |
| --- | --- | --- |
| 프레임워크 | Next.js 16.x App Router, React 19, TypeScript strict | 몽타주 4.3.2가 지원하는 가장 높은 Next.js 메이저 |
| UI | `@montage-ui/core`, `@montage-ui/icon`, `@montage-ui/nextjs` 4.3.2 | 5장 |
| 인증 | Supabase Auth, 이메일과 비밀번호 | `@supabase/supabase-js`, `@supabase/ssr` |
| 데이터베이스 | Supabase Postgres | 7장 |
| 배포 | Vercel | 환경 변수 3개 |
| 패키지 매니저 | pnpm 워크스페이스(모노레포) |  |
| 테스트 | Vitest | `lib/rules.ts`, `lib/tree.ts` 단위 테스트 |

Supabase 연결 코드는 [공식 SSR 가이드](https://supabase.com/docs/guides/auth/server-side/creating-a-client)(2026-11-12 갱신)의 Next.js 예제를 그대로 따른다. 가이드 기준으로 Next.js 16에서는 세션 갱신 파일이 `middleware.ts`가 아니라 `proxy.ts`이고, 서버에서 로그인 여부는 `supabase.auth.getClaims()`로 확인하며 `getSession()`은 믿지 않는다.

### 6.2 앱 폴더 구조 (apps/web)

웹 앱은 모노레포의 `apps/web`에 둔다. 이 문서의 다른 장에 나오는 `app/…`, `components/…`, `lib/…`, `proxy.ts` 경로는 모두 `apps/web` 아래를 뜻한다. 저장소 전체 구조는 12.1에 있다.

```
apps/web/
  app/
    layout.tsx              html, 글꼴, global.css, Providers, 검색 제외 설정
    manifest.ts             홈 화면에 추가용 웹 앱 매니페스트 (3.10)
    providers.tsx           'use client'. ThemeProvider + AppRouterCacheProvider
    actions.ts              서버 액션 7개 (8장)
    (auth)/login/page.tsx
    (auth)/signup/page.tsx
    (app)/layout.tsx        헤더, 하단 탭 바, 프로필 불러오기
    (app)/page.tsx          홈
    (app)/calendar/page.tsx
    (app)/garden/page.tsx
    (app)/loading.tsx       Skeleton
    error.tsx  not-found.tsx
  components/
    Header.tsx  BottomNav.tsx  ActionBar.tsx
    TodayPanel.tsx  WeekPanel.tsx  TreePanel.tsx  CampPanel.tsx
    TreeFigure.tsx  GrowthTrack.tsx  HarvestCardModal.tsx
    CalendarGrid.tsx  RecordTable.tsx  MemberCard.tsx
    SeedPicker.tsx  PlanPicker.tsx  SettingsModal.tsx  LoginForm.tsx  SignupForm.tsx
  lib/
    rules.ts                2.5의 기준 코드
    tree.ts                 4장의 나무 좌표와 열매 도형
    card.ts                 4.7의 수확 카드 그리기
    time.ts                 KST 오늘과 시각 표시
    copy.ts                 화면 문구 전부 (3장, 8장)
    data.ts                 화면이 쓰는 조회 함수 (7.5)
    fixtures.ts             화면 개발과 테스트용 가짜 데이터
    supabase/client.ts  server.ts  proxy.ts  admin.ts
  proxy.ts                  세션 갱신, 보호 경로 리다이렉트
  package.json  next.config.ts  tsconfig.json  vitest.config.ts
```

### 6.3 시간 처리 (`lib/time.ts`)

오늘 날짜와 표시 시각은 서버에서만 만들어 문자열로 내려보낸다. 브라우저의 시계와 시간대는 쓰지 않는다.

```ts
export const todayKST = (now = new Date()) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' }).format(now);           // '2026-12-03'

export const hhmmKST = (iso: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
    .format(new Date(iso));                                                             // '09:48'
```

### 6.4 환경 변수

| 이름 | 쓰는 곳 | 값 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 브라우저, 서버 | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | 브라우저, 서버 | publishable key |
| `SUPABASE_SECRET_KEY` | 서버 전용 | secret key. 가입 시 사용자 생성과 출근 기록 쓰기에만 쓴다 |

시즌 날짜와 공휴일은 환경 변수가 아니라 `lib/rules.ts`의 상수다.

### 6.5 읽기와 쓰기의 흐름

- 읽기: 서버 컴포넌트가 로그인한 사용자의 세션으로 Supabase를 조회한다. 행 수준 보안이 적용된다
- 계산: 서버에서 `computeStats`를 돌려 결과만 컴포넌트에 넘긴다
- 쓰기: 서버 액션이 `getClaims()`로 사용자를 확인하고 2.7의 조건을 검사한 뒤, secret key 클라이언트(`lib/supabase/admin.ts`)로 저장한다. 끝나면 `revalidatePath('/', 'layout')`로 화면을 새로 그린다
- 캐시: 모든 화면은 요청마다 새로 그린다. 로그인 쿠키가 실린 응답을 캐시하면 다른 사람에게 세션이 넘어갈 수 있다
- 조회량: 과수원은 시즌 전체 기록을 읽는다. 한 번에 1,000행을 넘을 수 있으므로 1,000행씩 나눠 끝까지 읽는다
- 애니메이션: 출근 액션이 돌려준 날짜를 클라이언트 상태로 받아, 새로 생긴 잎이나 꽃, 열매에만 한 번 모션을 준다

## 7. 데이터 모델과 권한

테이블은 구성원(`profiles`)과 출근 기록(`attendance`) 둘이다. 씨앗과 수확 시각은 `profiles`에 둔다. 로그인한 구성원은 둘 다 읽을 수 있지만 쓰기 정책은 두지 않아, 쓰기는 서버의 secret key로만 된다.

### 7.1 스키마 (`supabase/migrations/0001_init.sql`)

```sql
create type public.plan as enum ('light', 'steady', 'daily');
create type public.seed as enum ('apple', 'tangerine', 'peach', 'coffee');

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  name          text not null check (char_length(btrim(name)) between 2 and 20),
  plan          public.plan not null,
  seed          public.seed not null,
  join_date     date not null,                 -- 가입한 날의 KST 날짜
  harvested_at  timestamptz,                   -- 수확한 시각. 수확 전에는 비어 있다
  created_at    timestamptz not null default now()
);

create table public.attendance (
  user_id       uuid not null references public.profiles (id) on delete cascade,
  work_date     date not null,                 -- 출근한 날의 KST 날짜
  check_in_at   timestamptz,                   -- 운영자가 넣은 기록은 비어 있을 수 있다
  check_out_at  timestamptz,
  created_at    timestamptz not null default now(),
  primary key (user_id, work_date),
  constraint attendance_out_after_in
    check (check_out_at is null or (check_in_at is not null and check_out_at >= check_in_at))
);
create index attendance_work_date_idx on public.attendance (work_date);

alter table public.profiles   enable row level security;
alter table public.attendance enable row level security;

create policy "members read profiles"   on public.profiles
  for select to authenticated using (true);
create policy "members read attendance" on public.attendance
  for select to authenticated using (true);

revoke all on public.profiles, public.attendance from anon;
grant select on public.profiles, public.attendance to authenticated;
```

새 Supabase 프로젝트는 public 스키마의 새 테이블에 `service_role` 권한을 자동으로 주지 않는다. secret key 클라이언트가 7.3대로 읽고 쓸 수 있게 `supabase/migrations/0002_service_role.sql`을 이어서 실행한다.

```sql
grant select, insert, update, delete on public.profiles, public.attendance to service_role;
```

### 7.2 필드 뜻

| 테이블.필드 | 뜻 | 쓰는 곳 |
| --- | --- | --- |
| `profiles.id` | Supabase Auth 사용자 id | 모든 조회의 기준 |
| `profiles.name` | 화면에 보이는 이름. 중복 허용 | 헤더, 인사말, 과수원, 이름 칩, 수확 카드 |
| `profiles.plan` | 출근 플랜 코드 | `computeStats`의 `plan` |
| `profiles.seed` | 씨앗 코드 | 나무와 열매의 모양 |
| `profiles.join_date` | 가입한 날 | `computeStats`의 `joinDate` |
| `profiles.harvested_at` | 수확한 시각 | 수확 완료 상태, 수확 카드의 "수확한 날"(KST 날짜로 바꿔서) |
| `attendance.work_date` | 출근 날짜. 사람과 날짜 조합이 기본 키라 하루 1건 | 총 출근 일수, 주간 목표 |
| `attendance.check_in_at` | 출근 시각. 운영자가 넣은 기록은 비어 있을 수 있다 | 오늘 패널, 캘린더, 표 |
| `attendance.check_out_at` | 퇴근 시각. 선택 | 오늘 패널, 캘린더, 표 |

### 7.3 권한

| 주체 | profiles | attendance |
| --- | --- | --- |
| 로그인하지 않은 사람 | 접근 불가 | 접근 불가 |
| 로그인한 구성원(브라우저, 서버 컴포넌트) | 전체 읽기 | 전체 읽기 |
| 서버 액션(secret key) | 읽기, 추가, 수정 | 읽기, 추가, 수정 |

가입에 제한이 없어 사이트 주소를 아는 사람은 누구나 가입해 구성원이 된다. 구성원끼리는 서로의 이름, 플랜, 씨앗, 수확 여부, 출근 날짜와 시각을 API로 읽을 수 있고, 화면에는 다른 사람의 시각을 보이지 않는다. 이메일은 `auth.users`에만 있어 다른 구성원이 읽을 수 없다.

주소가 검색에 걸려 낯선 사람이 들어오는 일을 줄이려고 `app/layout.tsx`의 `metadata`에 `robots: { index: false, follow: false }`를 넣는다. 모르는 계정이 보이면 운영자가 Supabase 대시보드에서 지운다.

### 7.4 Supabase Auth 설정

| 설정 | 값 |
| --- | --- |
| 이메일 로그인 | 켬 |
| 새 사용자 공개 가입 | 끔. Supabase API로 직접 가입하지 못하게 막고, 가입 폼을 받은 서버 액션만 사용자를 만든다 |
| 이메일 확인 메일 | 보내지 않는다. 서버가 확인된 상태(`email_confirm: true`)로 만든다 |
| 비밀번호 최소 길이 | 8 |

### 7.5 화면별 조회

| 화면 | 읽는 데이터 |
| --- | --- |
| 공통(`(app)/layout.tsx`) | 내 `profiles` 1행 |
| 홈 | 내 `attendance` 전체, 오늘 날짜의 `attendance` 전체와 그 사람들의 이름 |
| 캘린더 | 내 `attendance` 전체 |
| 모두의 과수원 | `profiles` 전체, `attendance` 전체 |
| 수확 카드 | 내 `profiles` 1행, 내 `attendance` 전체 |

## 8. 서버 동작

쓰기는 `app/actions.ts`의 서버 액션 7개로만 한다. 화면이 버튼을 숨기거나 비활성으로 두더라도 서버는 조건을 처음부터 다시 검사한다.

### 8.1 공통 규칙

- 로그인과 가입을 뺀 모든 액션은 먼저 `getClaims()`로 사용자를 확인한다. 없으면 `/login`으로 보낸다
- 오늘은 `todayKST()`, 기록 시각은 서버의 현재 시각이다. 클라이언트가 보낸 날짜나 시각은 어떤 액션도 받지 않는다. 클라이언트가 보내는 값은 `checkIn`과 `checkOut`의 위도·경도뿐이다(2.8)
- 반환값은 `{ ok: true, message?, harvestedAt? }` 또는 `{ ok: false, errors?: { [항목]: 문구 }, message?: 문구 }` 형식이다
- 성공하면 `revalidatePath('/', 'layout')`을 부르고, 클라이언트는 `message`를 positive 토스트로 띄운다
- 예상하지 못한 실패는 `message: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.'`로 돌려주고 negative 토스트로 띄운다
- 처리하는 동안 누른 버튼은 `loading` 상태로 두어 다시 누르지 못하게 한다

### 8.2 액션별 처리

| 액션 | 입력 | 검사 | 저장 | 성공 뒤 |
| --- | --- | --- | --- | --- |
| `signUp` | 이름, 이메일, 비밀번호, 씨앗, 플랜 | 3.4의 검사 전부. 시즌 종료 뒤면 거절 | 사용자 생성, `profiles` 추가 | 로그인 상태로 `/`에 가고 토스트 "{이름}님, {씨앗 이름} 씨앗을 심었어요." |
| `signIn` | 이메일, 비밀번호 | 3.3의 검사 | 없음 | `/`로 이동 |
| `signOut` | 없음 | 없음 | 없음 | `/login`으로 이동 |
| `checkIn` | 위도, 경도 | 오늘이 출근일인가, 그라운드 반경 안인가 | `attendance` 추가(오늘, 출근 시각) | 8.3의 토스트 |
| `checkOut` | 위도, 경도 | 오늘 기록에 출근 시각이 있는가, 그라운드 반경 안인가 | 퇴근 시각을 지금으로 수정 | 토스트 "퇴근 시간을 기록했어요." |
| `harvest` | 없음 | 총 출근이 20일 이상인가 | `profiles.harvested_at`을 지금으로 | 수확 카드 모달(3.9). 토스트 없음 |
| `updateProfile` | 이름, 씨앗, 플랜 | 이름 2\~20자, 씨앗과 플랜 코드 | `profiles` 수정 | 토스트 "설정을 저장했어요." |

### 8.3 액션 세부

**signUp**

1. 항목을 모두 검사하고 오류를 한꺼번에 돌려준다. 초대 코드 같은 가입 제한은 두지 않는다
2. secret key 클라이언트의 관리자 API로 사용자를 만든다(`email_confirm: true`). 이미 있는 이메일이면 `errors.email`에 "이미 가입한 이메일이에요. 로그인해 주세요."
3. `profiles`에 `{ id, name, plan, seed, join_date: todayKST() }`를 넣는다. 실패하면 방금 만든 사용자를 지우고 공통 실패 문구를 돌려준다
4. 세션 클라이언트로 `signInWithPassword`를 불러 로그인 쿠키를 심고 `/?welcome=1`로 보낸다. 홈은 이 값을 보고 토스트를 한 번 띄운 뒤 주소에서 지운다

**signIn**

형식 검사를 통과하면 `signInWithPassword`를 부른다. 실패 이유와 상관없이 `errors.password`에 "이메일 또는 비밀번호가 맞지 않아요."만 돌려줘, 가입된 이메일인지 알 수 없게 한다.

**checkIn**

1. `isWorkday(todayKST())`가 아니면 `message: '오늘은 출근을 기록할 수 없는 날이에요.'`로 거절한다
2. 위도·경도가 숫자가 아니면 공통 실패 문구로, 그라운드 반경 밖이면 2.8의 반경 밖 문구로 거절한다
3. 저장 전 통계를 계산해 둔다
4. `(user_id, work_date)`가 이미 있으면 아무것도 바꾸지 않고 `{ ok: true }`만 돌려준다. 두 기기에서 동시에 눌러도 기록은 1건이다
5. 없으면 추가하고 저장 후 통계를 다시 계산해, 아래 순서로 처음 맞는 문구를 토스트로 돌려준다

| 순서 | 조건 | 토스트 |
| --- | --- | --- |
| 1 | 총 출근이 방금 20일이 됐다 | 열매가 열렸어요. 나무의 열매를 눌러 수확하세요. |
| 2 | 단계가 방금 새싹으로 바뀌었다 | 새싹이 났어요. |
| 2 | 단계가 방금 묘목으로 바뀌었다 | 묘목으로 자랐어요. |
| 2 | 단계가 방금 나무로 바뀌었다 | 나무가 됐어요. |
| 2 | 단계가 방금 꽃으로 바뀌었다 | 꽃이 폈어요. |
| 3 | 이번 주가 방금 달성으로 바뀌었다 | 출근을 기록했어요. 이번 주 목표도 달성했어요. |
| 4 | 총 출근이 20일을 넘었다 | 출근을 기록했어요. |
| 5 | 그 밖 | 출근을 기록했어요. 나무가 조금 자랐어요. |

**checkOut**

오늘 기록이 없거나 출근 시각이 없으면 `message: '먼저 출근을 기록해 주세요.'`로 거절한다. 그라운드 반경 밖이면 2.8의 반경 밖 문구로 거절한다. 이미 퇴근 시각이 있어도 지금 시각으로 덮어쓴다.

**harvest**

1. 서버가 그 사용자의 출근 기록을 읽어 총 출근 일수를 직접 센다. 20일 미만이면 `message: '아직 열매가 열리지 않았어요.'`로 거절한다
2. `harvested_at`이 이미 있으면 바꾸지 않고 `{ ok: true, harvestedAt }`을 돌려준다. 두 기기에서 눌러도 수확 시각은 먼저 누른 것 하나다
3. 없으면 지금 시각을 저장하고 `{ ok: true, harvestedAt }`을 돌려준다. 수확을 되돌리는 액션은 없다
4. 수확 카드 이미지는 브라우저가 그린다. 서버는 이미지를 만들거나 저장하지 않는다

**updateProfile**

이름과 플랜은 검사를 통과하면 저장한다. 씨앗은 `harvested_at`이 비어 있을 때만 바꾸고, 수확한 뒤에 온 씨앗 변경은 무시하고 나머지만 저장한다.

### 8.4 경로 보호 (`proxy.ts`)

| 요청 | 처리 |
| --- | --- |
| 로그인하지 않고 `/`, `/calendar`, `/garden` | `/login`으로 보낸다 |
| 로그인한 채 `/login`, `/signup` | `/`로 보낸다 |
| 로그인했지만 `profiles` 행이 없다 | `(app)/layout.tsx`에서 로그아웃시키고 `/login`으로 보낸다 |

리다이렉트 응답을 새로 만들 때는 공식 가이드대로 갱신된 쿠키와 캐시 헤더를 그 응답에 옮겨 담는다.

## 9. 문구 원칙과 예외 상태

화면 문구는 3장과 8장에 적힌 그대로 쓰고 바꾸지 않는다. 이 장은 새 문구가 필요해질 때 지킬 원칙과, 정상 흐름 밖의 상황을 정한다.

### 9.1 문구 원칙

- 문장은 해요체로 쓰고 마침표로 끝낸다. 버튼, 제목, 배지에는 마침표를 붙이지 않는다
- 판정하는 말(지각, 조퇴, 결근, 미달, 실패)을 쓰지 않는다. 못 채운 것보다 자란 것을 말한다
- 버튼 이름은 누르면 일어나는 일이다. "출근하기", "이미지 복사", "저장하기"
- 이모지를 쓰지 않는다
- 숫자 단위는 날 "일", 사람 "명", 주 "주"다

| 값 | 형식 | 예 |
| --- | --- | --- |
| 문장 속 날짜 | {M}월 {D}일 {요일}요일 | 12월 3일 목요일 |
| 요일 없는 날짜 | {M}월 {D}일 | 12월 17일 |
| 달 제목 | {YYYY}년 {M}월 | 2026년 12월 |
| 시각 | 24시간제 HH:MM | 09:48 |
| 시각 범위 | HH:MM \~ HH:MM | 09:48 \~ 18:32 |
| 없는 시각 | 오늘 패널은 "미기록", 표는 "–" |  |

### 9.2 용어

| 화면에 쓰는 말 | 뜻 | 코드 이름 |
| --- | --- | --- |
| 씨앗 | 가입할 때 고르는 나무의 종류 | `profiles.seed`, `SEEDS` |
| 나무 | 총 출근 일수만큼 자라는 그림 | `days`, `growth()` |
| 단계 | 씨앗, 새싹, 묘목, 나무, 꽃, 열매 | `STAGES` |
| 열매 | 총 출근 20일에 열리는 것. 한 사람에 1개 | `FRUIT_DAYS` |
| 수확 | 열매를 눌러 따는 일. 한 번만 한다 | `profiles.harvested_at` |
| 수확 카드 | 출근 기록을 요약한 이미지. 운영진에게 보낸다 | `lib/card.ts` |
| 이번 주 목표 | 이번 주에 채울 출근 일수 | `weekGoal` |
| 연속 달성 | 주간 목표를 이어서 채운 주의 수 | `streak` |
| 그라운드 | 캠프 교육장. 출근하는 곳. 반경 500m 안에서만 출근·퇴근을 기록한다 | `CAMP` |
| 그라운드에 있어요 | 오늘 출근했고 아직 퇴근 전 |  |
| 쉬는 날 | 주말, 공휴일처럼 출근일이 아닌 날 | `!isWorkday` |
| 과수원 | 구성원 모두의 나무를 보는 화면 | `/garden` |

### 9.3 예외 상태

| 상황 | 처리 |
| --- | --- |
| 화면을 켜 둔 채 자정이 지났다 | 액션은 서버의 오늘로 판단한다. 응답 뒤 화면이 새 날짜로 다시 그려진다 |
| 두 기기에서 출근을 눌렀다 | 기록은 1건만 남는다. 늦은 쪽은 토스트 없이 현재 상태를 보인다 |
| 퇴근을 누르지 않고 다음 날이 됐다 | 전날 퇴근은 빈 채로 남는다. 출근 기록은 유지된다 |
| 출근을 누르지 못한 날이 있다 | 본인은 추가할 수 없다. 운영자에게 알리면 운영자가 확인하고 넣는다(11.2) |
| 20일을 채웠지만 열매를 누르지 않았다 | 열매는 계속 달려 있고, 시즌이 끝난 뒤에도 수확할 수 있다 |
| 두 기기에서 수확을 눌렀다 | 수확 시각은 먼저 누른 것 하나만 남고, 양쪽 모두 수확 카드가 열린다 |
| 위치 권한을 거부했거나 위치를 못 잡는다 | 출근·퇴근을 기록하지 않고 2.8의 안내 토스트를 띄운다. 그날은 운영자가 넣는다(11.2) |
| 그라운드 반경 밖에서 눌렀다 | 기록하지 않고 거리를 알려 준다(2.8) |
| 남은 출근일로는 20일을 채울 수 없다 | 3.5의 "모자라요" 문장을 보인다. 나무는 계속 자란다 |
| 수확한 뒤에 출근했다 | 기록되고 총 출근 일수도 늘지만 나무는 변하지 않는다. 수확 카드의 총 출근은 카드를 여는 시점의 값이다 |
| 이미지 복사가 안 되는 브라우저다 | 실패 토스트로 길게 누르기를 안내한다. 이미지 저장은 따로 동작한다 |
| 플랜을 바꿨다 | 주간 목표와 연속 달성만 새 플랜으로 다시 계산한다. 나무와 수확은 그대로다 |
| 시즌 중간에 가입했다 | 주간 목표는 가입한 날부터 계산하고 나무는 씨앗에서 시작한다 |
| 시즌이 끝난 뒤 `/signup`에 왔다 | 폼 대신 "12월 25일로 시즌이 끝나 새로 가입할 수 없어요."와 로그인 링크만 보인다 |
| 시즌이 끝난 뒤 로그인했다 | 모든 화면을 읽을 수 있고 출근 버튼만 비활성이다. 수확과 수확 카드 보기는 된다 |
| 로그인이 만료된 채 버튼을 눌렀다 | `/login`으로 보낸다 |
| 이름이 같은 구성원이 있다 | 그대로 둔다. 구분하지 않는다 |

### 9.4 불러오기와 오류 화면

| 화면 | 내용 |
| --- | --- |
| 불러오는 중(`loading.tsx`) | 패널 자리에 같은 크기의 `Skeleton`. 글자는 없다 |
| 오류(`error.tsx`) | 제목 "화면을 불러오지 못했어요", 설명 "잠시 후 다시 시도해 주세요.", `Button` "다시 시도" |
| 없는 주소(`not-found.tsx`) | 제목 "찾는 화면이 없어요", `Button` "홈으로 가기" |

## 10. 수용 기준

아래 항목을 모두 통과하면 완성이다. 화면 항목은 예시 사이트를 같은 날짜 상태로 맞춰 나란히 놓고 비교한다.

**규칙 (Vitest 단위 테스트로 작성)**

- [ ] 기록할 수 있는 출근일이 27일이다. 사전 기간 3일, 정식 기간은 주별로 5, 5, 5, 5, 4일이다
- [ ] `growth`가 0, 1, 4, 5, 9, 10, 14, 15, 19, 20, 27일에 대해 2.6의 단계 경계와 같은 단계를 돌려준다
- [ ] 2.6의 검산용 예시 첫 네 줄이 모두 기대값과 같다
- [ ] `workdaysLeft`가 12-17에 출근 전이면 6, 출근 후면 5를 돌려준다
- [ ] `fruitShapes`의 도형 수가 사과 4개, 귤 4개, 복숭아 5개, 커피 6개다
- [ ] `todayKST`가 UTC 15:00 이후에는 다음 날짜를 돌려준다

**가입과 로그인**

- [ ] 이름, 이메일, 비밀번호, 씨앗, 플랜만으로 가입되고 초대 코드 입력란이 없다
- [ ] 빈 폼을 제출하면 다섯 항목의 오류가 한꺼번에 보이고 첫 항목에 포커스가 간다
- [ ] 가입 직후 로그인 상태로 홈에 오고, 나무는 씨앗 단계이며, 환영 토스트가 한 번 뜬다
- [ ] 틀린 비밀번호와 없는 이메일이 같은 오류 문구를 보인다
- [ ] 로그인하지 않고 `/`, `/calendar`, `/garden`에 가면 `/login`으로 간다

**홈과 나무**

- [ ] 출근하기를 누르면 총 출근이 1 늘고, 새로 생긴 잎이나 꽃 하나만 튀어 오르고, 배지가 "그라운드에 있어요"로 바뀐다
- [ ] 출근 뒤 새로고침해도 상태가 그대로다
- [ ] 퇴근하기를 누르면 퇴근 시간이 찍히고 버튼이 "퇴근 시간 다시 기록"으로 바뀐다
- [ ] 그라운드 반경 500m 밖이거나 위치 권한이 없으면 출근·퇴근이 기록되지 않고 2.8의 안내가 뜬다. 위치는 DB에 저장되지 않는다
- [ ] 토요일, 일요일, 12-25에는 버튼이 비활성이고 다음 출근일이 안내된다. 11-18\~11-20에는 출근할 수 있고 이번 주 패널에 정식 시작일이 안내된다
- [ ] 주간 목표를 채운 출근에서 "목표 달성" 배지가 뜬다
- [ ] 총 출근 0, 1, 5, 10, 15, 20일에서 나무가 씨앗, 새싹, 묘목, 나무, 꽃, 열매 모습이고 예시 사이트와 같다
- [ ] 성장 트랙이 총 출근 / 20만큼 채워지고 도달한 단계가 강조된다
- [ ] 남은 출근일로 20일을 채울 수 없는 계정에 "모자라요" 문장이 보인다
- [ ] 오늘 그라운드에 오늘 출근한 사람이 출근 순서대로 보이고, 퇴근한 사람은 점이 없다

**수확**

- [ ] 총 출근 19일인 계정이 출근하면 열매가 열리고 "열매가 열렸어요" 토스트가 뜬다
- [ ] 열매를 클릭하거나 포커스 후 Enter를 누르면 수확되고, 바구니가 나타나고, 수확 카드 모달이 열린다
- [ ] 수확 카드의 이름, 열매, 총 출근, 플랜, 첫 출근, 수확한 날, 출근 점 27개가 실제 기록과 같다
- [ ] "이미지 복사" 뒤 메신저 입력창에 붙여 넣으면 카드가 붙는다. 데스크톱 Chrome, iOS Safari, Android Chrome에서 확인한다
- [ ] "이미지 저장"으로 PNG 파일이 저장된다
- [ ] 총 출근 19일인 계정으로 `harvest` 액션을 직접 부르면 서버가 거절한다
- [ ] 수확 뒤 새로고침하거나 다시 로그인해도 수확 완료 상태이고, "수확 카드 보기"로 카드가 다시 열리며, 내 설정에서 씨앗을 바꿀 수 없다

**캘린더**

- [ ] 11월과 12월만 오갈 수 있고 주말, 12-25, 시즌 밖 날짜가 흐리게 보인다
- [ ] 출근한 날에 잎색 원과 시간이 보이고, 기록을 추가하거나 고치는 버튼이 없다

**모두의 과수원**

- [ ] 내 카드가 맨 앞이고, 오늘 출근한 사람이 그다음에 출근 순서로 온다
- [ ] 각 카드의 미니 나무가 그 사람의 씨앗과 총 출근 일수에 맞다
- [ ] 수확한 사람에게만 "수확 완료" 배지가 보이고, 요약 문장의 수확 인원이 배지 수와 같다
- [ ] 다른 사람의 출근 시각이 화면 어디에도 보이지 않는다

**모바일**

- [ ] 폭 390px에서 하단 탭 바에 항목 3개가 보이고 헤더의 탭은 보이지 않는다
- [ ] 홈에서 출근 버튼이 하단 탭 바 바로 위에 고정되고, 오늘 패널 안에는 버튼이 없다
- [ ] 폭 360px에서 가로 스크롤이 생기지 않는다(기록 표 안쪽 스크롤은 예외)
- [ ] 홈 인디케이터가 있는 아이폰에서 하단 탭 바와 고정 버튼이 가려지지 않는다
- [ ] 내 설정과 수확 카드가 아래에서 올라오는 시트로 열리고, 내용이 길면 시트 안에서 스크롤된다
- [ ] 홈 화면에 추가하면 "커리어캠프"(짧은 이름) 이름과 아이콘으로 열린다

**디자인**

- [ ] `package.json`의 `@montage-ui/*` 세 패키지가 모두 4.3.2로 고정돼 있다
- [ ] 버튼, 입력, 탭, 하단 탭 바, 배지, 표, 토스트, 모달이 몽타주 컴포넌트다
- [ ] 헥스 색상값은 `lib/tree.ts`와 `lib/card.ts`에만 있고, `var(--semantic-` 문자열은 어디에도 없다
- [ ] 운영체제를 다크 모드로 바꾸면 화면이 다크 테마로 바뀌고 나무 색이 4.5의 다크 값이 된다. 수확 카드 이미지는 그대로 라이트 색이다
- [ ] 키보드만으로 가입, 출근, 수확, 설정 저장을 끝낼 수 있다

**보안과 배포**

- [ ] 로그인한 사용자의 토큰으로 Supabase API에 직접 `attendance`를 추가하거나 `profiles.harvested_at`을 바꾸려 하면 거절된다
- [ ] `SUPABASE_SECRET_KEY`가 브라우저로 내려가는 번들에 없다
- [ ] 모든 페이지에 검색 제외(`noindex`) 설정이 들어 있다
- [ ] Vercel 배포 주소에서 위 항목이 로컬과 똑같이 동작한다

## 11. 배포, 운영, 확인할 가정

배포는 Supabase 프로젝트를 먼저 만들고 Vercel에 환경 변수 3개를 넣는 순서다. 관리자 화면이 없으므로 운영자는 Supabase 대시보드와 과수원 화면으로 일한다.

### 11.1 배포 절차

1. Supabase에서 프로젝트를 만든다. 리전은 서울(ap-northeast-2)로 한다
2. SQL Editor에서 7.1의 `0001_init.sql`과 `0002_service_role.sql`을 차례로 실행한다
3. Authentication 설정을 7.4 표대로 맞춘다
4. API 키 화면에서 프로젝트 URL, publishable key, secret key를 복사한다
5. 코드를 GitHub 저장소에 올리고 Vercel에서 그 저장소로 프로젝트를 만든다. Root Directory는 apps/web, Production Branch는 `main`으로 지정한다. `main`에 푸시되면 운영 배포, `develop`과 PR은 미리보기 배포가 된다(12.2)
6. Vercel 환경 변수에 6.4의 3개를 Production과 Preview 모두에 넣는다
7. 배포한 주소에서 10장의 수용 기준을 점검한다. 점검용 계정은 끝나고 Supabase 대시보드에서 지운다
8. 캠프 채널에 주소를 공유한다

### 11.2 운영자가 하는 일

| 일 | 방법 |
| --- | --- |
| 사전 기간(11-18\~11-20)과 누르지 못한 날의 출근 넣기 | 본인의 요청을 확인한 뒤 Supabase Table Editor에서 `attendance`에 행을 추가한다. `user_id`와 `work_date`만 넣고 시각은 비워 둔다 |
| 커피 쿠폰 주기 | DM으로 수확 카드 이미지를 받으면 과수원 화면에서 그 사람의 "수확 완료" 배지를 확인하고 쿠폰을 보낸다. 누구에게 줬는지는 운영자가 따로 적어 둔다 |
| 잘못 누른 출근이나 수확 되돌리기 | `attendance`의 그 행을 지우거나 `profiles.harvested_at`을 비운다 |
| 비밀번호를 잊은 사람 돕기 | Authentication 화면에서 새 비밀번호를 정해 전달한다 |
| 모르는 계정 지우기 | Authentication 화면에서 그 사용자를 지운다. `profiles`와 `attendance`는 같이 지워진다 |

### 11.3 확정한 것과 확인할 것

| 항목 | 지금 정한 값 | 상태 | 바꿀 때 고칠 곳 |
| --- | --- | --- | --- |
| 정식 시작일 | 2026-11-23(월). 기록은 11-18부터 받고 그 3일도 출근으로 센다 | 확정 | `SEASON` |
| 주간 목표 | "1\~2일"은 1일, "3\~4일"은 3일, 매일은 5일 | 확정 | `PLANS` |
| 가입 제한 | 없음. 사이트 주소를 아는 사람은 누구나 가입한다 | 확정 | `signUp` |
| 열매 기준 | 총 출근 20일. 플랜과 상관없이 같다 | 확정 | `FRUIT_DAYS` |
| 수확과 쿠폰 | 열매를 눌러 수확하고, 수확 카드 이미지를 DM으로 보내면 운영진이 쿠폰을 준다 | 확정 | 3.9 |
| 출근 확인 | 그날 본인이 그라운드 반경 500m 안에서 누른 것만 인정한다. 지난 날 직접 추가는 없고 위치는 저장하지 않는다 | 확정 | 2.7, 2.8 |
| 마지막 출근일 | 12-24(목). 12-25는 성탄절이라 출근일이 아니다 | 확인 필요 | `HOLIDAYS` |
| 씨앗 종류 | 사과, 귤, 복숭아, 커피 4종 | 확인 필요. 디자이너 시안에 따라 바뀐다 | `SEEDS`, `lib/tree.ts` |
| 성장 단계 | 1일 새싹, 5일 묘목, 10일 나무, 15일 꽃 | 확인 필요 | `STAGES` |
| 서비스 이름 | 커리어캠프 출근부(짧은 이름 커리어캠프). 로고는 유리 큐브(4.6) | 확정 | `lib/copy.ts`, `design/handoff/2026-11-18-logo` |
| 사전 기간 기록 | 사이트가 열리기 전 날짜는 운영자가 넣는다 | 확인 필요 | 11.2 |
| 쿠폰 지급 기록 | 사이트에 남기지 않는다 | 확인 필요 | 범위 밖 |
| 공개 범위 | 가입한 사람은 누구나 구성원의 이름, 플랜, 나무, 수확 여부, 오늘 출근 여부를 본다 | 확인 필요 | 3.7, 7.3 |

열매 기준이 플랜과 상관없이 20일이라, 주 1\~2일 플랜은 5주 동안 매주 2일을 나와도 10일(사전 기간을 모두 나와도 13일)이어서 열매를 맺지 못한다. 주 3\~4일 플랜은 매주 4일을 빠짐없이 나와야 20일이 된다.

### 11.4 출처

- [Montage 문서](https://montage.wanted.co.kr): 컴포넌트와 토큰 안내
- [wanteddev/montage-web](https://github.com/wanteddev/montage-web): 4.3.2 소스, 토큰 값, `montage-react` 가이드. 2026-11-18에 확인
- [Supabase: Creating a Supabase client for SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client): Next.js 연결 코드, `proxy.ts`, `getClaims()`. 2026-11-12 갱신본

## 12. 저장소와 디자인 반영

코드, 기획서, 디자인 작업물을 pnpm 워크스페이스 모노레포 하나에 둔다. 디자이너 작업물이 올라오면 화면 모양은 그 시안이 기준이 되고, 규칙과 데이터는 이 문서가 계속 기준이다.

### 12.1 저장소 구조

```
camp-attendance/
  apps/
    web/                      Next.js 앱 (6.2)
  packages/                   둘 이상의 앱이 같이 쓸 코드가 생기면 만든다. 처음에는 없다
  design/
    README.md                 디자이너용 안내 (12.5의 올리는 규칙)
    reference/
      prototype.html          기획 단계의 예시 사이트. 고치지 않는다
    handoff/
      2026-11-25-home/        디자이너가 올리는 작업물. 날짜-주제 폴더 하나가 한 묶음
        README.md             대상 화면, 바뀐 점, 아티팩트 링크
        home.html             Claude 아티팩트로 만든 시안
  docs/
    spec.md                   이 기획서
    design-log.md             디자인 반영 기록과 남은 질문
  supabase/
    migrations/0001_init.sql
  .github/workflows/ci.yml    lint, typecheck, test
  CLAUDE.md                   에이전트 작업 규칙 (13.3)
  README.md                   실행 방법
  package.json                워크스페이스 스크립트
  pnpm-workspace.yaml
  .nvmrc  .gitignore
```

### 12.2 워크스페이스 설정

| 파일 | 내용 |
| --- | --- |
| `pnpm-workspace.yaml` | `packages`에 `apps/*`와 `packages/*` |
| 루트 `package.json` | `private: true`. 스크립트 `dev`, `build`, `lint`, `typecheck`, `test`는 각각 `pnpm --filter web <이름>`을 부른다 |
| `apps/web/package.json` | 이름 `web`. 의존성은 6.1 표 |
| `.nvmrc` | Node.js 버전 한 줄. Vercel 프로젝트의 Node.js 버전과 같은 메이저로 맞춘다 |
| `.gitignore` | `node_modules`, `.next`, `.env*.local`, `.vercel` |
| `apps/web/.env.example` | 6.4의 변수 이름만 적고 값은 비운다 |
| `.github/workflows/ci.yml` | PR과 `main`·`develop` 푸시마다 `pnpm lint`, `pnpm typecheck`, `pnpm test` |

브랜치는 둘을 둔다.

| 브랜치 | 쓰임 | Vercel |
| --- | --- | --- |
| `develop` | 작업 내용을 모으는 브랜치. 평소 푸시는 여기에 한다 | 미리보기 배포 |
| `main` | 운영 배포용. `develop`을 합칠 때만 바뀌고 직접 커밋하지 않는다 | 운영 배포(Production Branch) |

작업은 `develop`에서 하거나, 단계나 디자인 반영 단위로 `develop`에서 브랜치를 만들어 PR로 `develop`에 합친다. 배포할 때는 `develop`을 `main`에 합쳐 푸시하고, 그 푸시로 Vercel 운영 배포가 자동으로 돈다. Vercel이 `develop`과 PR마다 미리보기 주소를 만들어 주므로 디자이너와 구성원은 그 주소로 확인한다.

### 12.3 받은 파일 두는 곳

| 받은 파일 | 저장 위치 | 다루는 법 |
| --- | --- | --- |
| 이 기획서(Markdown) | `docs/spec.md` | 구현의 기준. 규칙이나 화면이 바뀌면 이 파일을 먼저 고치고 코드를 고친다 |
| 예시 사이트 HTML | `design/reference/prototype.html` | 참고용. 고치지 않는다 |

### 12.4 prototype.html 쓰는 법

`prototype.html`은 브라우저에서 바로 열리는 단일 파일이고, 몽타주 컴포넌트를 CSS로 흉내 낸 것이다. 코드를 옮겨 쓰지 않고, 정식 화면과 나란히 놓고 모양과 동작을 비교하는 데 쓴다. "예시 계정으로 둘러보기"와 맨 위의 날짜 이동 버튼으로 모든 상태를 볼 수 있다.

| 참고할 것 | 가져오지 않을 것 |
| --- | --- |
| 화면 배치, 간격, 상태별로 달라지는 모습. 모바일 폭에서의 배치 | `.m-…` 클래스의 CSS와 `:root`의 색 변수. 몽타주 컴포넌트와 theme 토큰으로 만든다 |
| 화면 문구 | 맨 위 예시 바와 날짜 이동 |
| `treeSVG`, `fruitShapes`, `buildCard`가 나무와 수확 카드를 그리는 방법(4장과 같다) | 브라우저 저장소에 기록을 두는 코드, 가상 구성원을 만드는 코드 |
| `computeStats`, `growth` 같은 규칙 함수의 동작(2.5와 같다) | `#home` 같은 해시 주소, 비밀번호를 확인하지 않는 로그인 |

| prototype의 클래스 | 정식 구현 |
| --- | --- |
| `.m-btn` | `Button` |
| `.m-text-btn` | `TextButton` |
| `.m-icon-btn` | `IconButton` |
| `.m-tablist`, `.m-tab` | `Tab`, `TabList`, `TabListItem` |
| `.bnav` | `BottomNavigation`, `BottomNavigationItem` |
| `.m-control`, `.m-label`, `.m-field`, `.m-msg` | `FormControl` 계열과 `TextField` |
| `.m-framed`, `.m-radio`, `.seed-opt` | `framedStyle`, `Radio` |
| `.m-badge` | `ContentBadge` |
| `.m-secmsg` | `SectionMessage` |
| `.m-table` | `Table` |
| `.m-toast` | `useToast` |
| `.m-modal` | `Modal` |
| `.panel`, `.weekdots`, `.cal-…`, `.tr-…`, `.track`, `.action-bar`, `.hv-img` | 직접 만드는 컴포넌트 |

### 12.5 디자이너 작업물 반영

디자이너는 한 번 올릴 때마다 `design/handoff/` 아래에 `날짜-주제` 폴더를 하나 만든다. `design/README.md`에는 아래 규칙을 적어 둔다.

- 폴더 이름은 `YYYY-MM-DD-주제`다. 예: `2026-11-25-home`
- 시안은 Claude 아티팩트로 만든 HTML 파일을 내려받아 올린다. 파일 하나에 화면 하나나 흐름 하나를 담고, 이름은 화면 이름으로 한다. 예: `home.html`
- 폴더 안 `README.md`에 대상 화면, 바뀐 점, 아티팩트 링크를 적는다. 라이트·다크, 모바일·데스크톱 중 무엇을 그렸는지도 적는다
- 글꼴이나 큰 이미지를 HTML 안에 넣지 않는다. 파일이 커지면 에이전트가 읽기 어렵다
- 이미 올린 폴더는 고치지 않는다. 바뀌면 새 날짜 폴더를 만든다

시안 HTML은 `prototype.html`과 같은 방식으로 다룬다. 브라우저에서 열어 모양과 동작의 기준으로 삼고, 코드는 옮기지 않고 12.4의 표대로 몽타주 컴포넌트로 다시 만든다.

무엇이 기준인지는 다루는 내용에 따라 다르다.

| 다루는 것 | 기준 |
| --- | --- |
| 화면 모양(배치, 간격, 나무와 열매 그림, 수확 카드) | 가장 최근 시안, 그다음 이 문서 3·4장, 그다음 `prototype.html` |
| 화면 문구 | 시안에 새 문구가 있으면 시안, 없으면 이 문서 |
| 규칙, 데이터, 서버 동작(2·7·8장) | 이 문서. 시안대로 하려면 규칙을 바꿔야 할 때는 구현 전에 묻는다 |
| 디자인 시스템 | 몽타주. 시안이 몽타주 컴포넌트나 토큰으로 표현되지 않으면 구현 전에 묻는다 |

새 폴더가 올라오면 다음 순서로 반영한다.

1. 폴더를 읽고 현재 구현과 다른 점을 목록으로 정리한다
2. 규칙, 문구, 몽타주와 부딪히는 항목을 따로 표시해 사용자에게 묻는다
3. `docs/spec.md`의 해당 절을 시안에 맞게 고친다
4. 코드를 고친다
5. `docs/design-log.md`에 날짜, 폴더, 바뀐 화면, 남은 질문을 적는다
6. PR을 올려 미리보기 주소로 디자이너의 확인을 받는다

### 12.6 고치기 쉽게 만드는 규칙

화면은 계속 바뀌고 규칙은 거의 바뀌지 않는다. 둘을 섞지 않으면 시안이 올 때마다 고칠 곳이 좁아진다.

- 규칙 계산은 `lib/rules.ts`에만 둔다. 컴포넌트 안에서 날짜나 목표를 다시 계산하지 않는다
- 화면 문구는 `lib/copy.ts`에 모은다. 컴포넌트에 한글 문장을 직접 쓰지 않는다
- 나무 좌표와 열매 도형은 `lib/tree.ts`에 모은다
- 색과 글자는 몽타주 토큰으로 쓰고, 이 문서가 px로 정한 간격은 각 컴포넌트 파일 위쪽에 상수로 둔다
- 화면은 6.2의 패널 단위 컴포넌트로 나누고, 패널은 계산이 끝난 값만 props로 받는다
- 데이터는 `lib/data.ts`의 함수로만 읽는다. 처음에는 `lib/fixtures.ts`로 구현하고 나중에 Supabase로 바꿔도 화면 코드는 그대로 둔다

## 13. Claude Code 작업 순서

에이전트는 받은 파일 둘(이 기획서와 `prototype.html`)만으로 아래 다섯 단계를 순서대로 진행한다. 한 단계가 끝날 때마다 완료 기준을 확인하고, 커밋하고, 한 일과 다음 단계 계획을 짧게 보고한다.

### 13.1 시작 지시문

빈 폴더에 두 파일을 넣고 Claude Code에 아래 글을 붙여 넣어 시작한다.

```
이 폴더에 열매 출근부 기획서(.md)와 예시 사이트(prototype.html)가 있어.
기획서를 처음부터 끝까지 읽고, 13장의 작업 순서대로 진행해 줘.
먼저 1단계(저장소 뼈대)만 하고, 끝나면 만든 구조와 2단계 계획을 보여 줘.
기획서에 없는 결정이 필요하면 추측하지 말고 물어봐.
```

### 13.2 단계

| 단계 | 하는 일 | 완료 기준 |
| --- | --- | --- |
| 1. 저장소 뼈대 | `git init`, 12.1 구조와 12.2 설정 파일, 받은 파일 둘을 12.3 위치로 옮기기, `CLAUDE.md`(13.3), `README.md`, `design/README.md`, `docs/design-log.md`. `apps/web`에 Next.js 16과 몽타주 4.3.2 설치, 5.1의 Provider 설정, 경로 5개의 빈 화면 | `pnpm install`, `pnpm dev`, `pnpm lint`, `pnpm typecheck`가 오류 없이 돈다. 몽타주 `Button` 하나가 라이트와 다크에서 제대로 보인다 |
| 2. 규칙 | `lib/rules.ts`, `lib/tree.ts`, `lib/time.ts`와 단위 테스트 | `pnpm test`로 10장의 "규칙" 항목이 모두 통과한다 |
| 3. 화면 | `lib/copy.ts`, `lib/fixtures.ts`, fixtures로 구현한 `lib/data.ts`, 3장과 4장의 화면 전부. 버튼은 화면 안의 상태만 바꾼다 | `prototype.html`과 나란히 놓고 3장 표의 상태를 모두 확인한다. 10장의 "디자인"과 "모바일" 항목이 통과한다 |
| 4. 서버 | 7장 스키마, Supabase 연결, 8장 서버 액션과 `proxy.ts`, `lib/data.ts`를 Supabase 구현으로 교체 | 10장의 "가입과 로그인", "홈과 나무", "수확", "캘린더", "모두의 과수원" 항목이 통과한다 |
| 5. 배포 | 11.1 절차 | 10장의 "보안과 배포" 항목이 통과한다 |

- 3단계의 fixtures는 플랜이 섞인 구성원 6명 이상과 2.6의 첫 예시(11-18 가입, 출근 19일, 오늘 12-17)와 수확을 마친 구성원 1명 이상를 담는다. 오늘 날짜를 바꿔 볼 수 있게 `todayKST`에 넘길 값을 개발 환경 변수로 덮어쓸 수 있게 한다
- 4단계는 사용자가 Supabase 프로젝트를 만들어야 시작할 수 있다. 3단계가 끝나면 필요한 값(6.4)과 설정(7.4)을 사용자에게 요청한다
- 디자이너 작업물은 어느 단계에서든 올라올 수 있다. 하던 단계를 끝낸 뒤 12.5 순서로 반영한다

### 13.3 CLAUDE.md 내용

1단계에서 저장소 루트에 아래 내용으로 만든다.

```
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
```

### 13.4 묻고 진행하는 기준

| 상황 | 에이전트가 할 일 |
| --- | --- |
| 기획서에 답이 있다 | 그대로 구현한다 |
| 기획서와 `prototype.html`이 다르다 | 기획서를 따른다 |
| 시안과 기획서의 화면 모양이 다르다 | 시안을 따르고 `docs/spec.md`를 고친다 |
| 시안이 규칙, 문구, 몽타주와 부딪힌다 | 구현 전에 묻는다 |
| 기획서에 없는 결정이 필요하다 | 묻는다. 급하지 않은 질문은 `docs/design-log.md`에 모아 단계 끝에 한꺼번에 묻는다 |
| 몽타주 컴포넌트의 props가 확실하지 않다 | 타입 정의와 예제를 확인한다. 그래도 안 되면 묻는다 |
| 라이브러리가 이 문서와 다르게 동작한다 | 공식 문서를 확인하고, 문서와 달라진 점을 보고한 뒤 진행한다 |
