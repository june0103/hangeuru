// 화면 문구는 이 파일에만 둔다 (docs/spec.md 3장, 8장, 9장, 12.6). 문구를 바꿀 때는 spec을 먼저 고친다.
import { FRUIT_DAYS, PLANS, SEASON, SEEDS, dow } from './rules';

type PlanKey = keyof typeof PLANS;
type SeedKey = keyof typeof SEEDS;

/* ---------- 날짜 형식 (9.1) ---------- */
export const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'] as const;
const md = (s: string) => `${+s.slice(5, 7)}월 ${+s.slice(8, 10)}일`;
/** 12월 3일 목요일 */
export const koDate = (s: string) => `${md(s)} ${WEEKDAYS[dow(s)]}요일`;
/** 12월 17일 */
export const koDay = md;
/** 2026년 12월 */
export const koMonth = (ym: string) => `${+ym.slice(0, 4)}년 ${+ym.slice(5, 7)}월`;
/** 9시간 7분, 3시간, 42분, 35초 */
export function calendarDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  if (seconds > 0 && seconds < 60) return `${seconds}초`;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  if (!hours) return `${minutes}분`;
  return minutes ? `${hours}시간 ${minutes}분` : `${hours}시간`;
}
/** 24시간이 넘어도 시간을 그대로 표시한다. */
export function clockDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map(value => String(value).padStart(2, '0'))
    .join(':');
}
export const DASH = '–';

/* ---------- 공통 ---------- */
export const APP_NAME = '커리어캠프 출근부';
/** 홈 화면 아이콘 아래처럼 좁은 곳에 쓰는 이름 */
export const APP_SHORT_NAME = '커리어캠프';
export const BRAND = {
  /** 헤더의 원티드 로고를 스크린리더가 읽는 이름 */
  wanted: '원티드',
};
export const NAV = {
  home: '내 씨앗',
  calendar: '캘린더',
  garden: '모두의 과수원',
  gardenShort: '과수원',
  ariaLabel: '주요 화면',
} as const;
export const HEADER = {
  userName: (name: string) => `${name}님`,
  openSettings: '프로필 열기',
  signOut: '로그아웃',
  /** 헤더의 화면 테마 전환(3.2) */
  theme: '화면 테마',
  themeModes: { light: 'Light', dark: 'Dark', system: 'Auto' },
} as const;
export const PAGE_TITLES = {
  login: '로그인',
  signup: '가입하기',
  home: '내 씨앗',
  calendar: '캘린더',
  garden: '모두의 과수원',
  start: '시작하기',
  seeds: '씨앗 고르기',
  fruit: '열매가 열렸어요',
} as const;

export const DEMO = {
  attendanceHint: '출퇴근 기록은 캘린더에서 확인할 수 있어요.',
  memberName: (index: number) => `구성원 ${String(index + 1).padStart(2, '0')}`,
} as const;

export const planLabel = (p: PlanKey) => PLANS[p].label;
export const seedLabel = (s: SeedKey) => SEEDS[s].label;
export const fruitLabel = (s: SeedKey) => SEEDS[s].fruit;
export const treeName = (s: SeedKey) => `${SEEDS[s].label}나무`;

/* ---------- 스플래시, 씨앗 고르기, 20일 열매 화면 ---------- */
export const SPLASH = {
  skip: '건너뛰기',
  start: '시작하기',
  down: '아래로',
  nextLabel: '다음 장면으로',
  heroLabel: '사과, 귤, 복숭아, 커피 열매가 모여 씨앗 하나가 되고, 씨앗이 흙에 내려앉는 모습',
  // 제목 위 표지는 영문 글자만 쓴다. title 과 text 는 줄 단위
  scenes: [
    { eyebrow: 'Wanted Career Camp', title: ['새로운 여정이', '시작돼요'], text: [APP_NAME] },
    { eyebrow: 'Step 1', title: ['씨앗 하나를 골라요'], text: ['사과, 귤, 복숭아, 커피.', '캠프 동안 내가 키울 나무예요.'] },
    { eyebrow: 'Step 2', title: ['출근한 날만큼 자라요'], text: ['어떤 나무가 될지는 직접 키우면서 만나요.'] },
  ],
} as const;
export const SEED_SCREEN = {
  title: '어떤 씨앗을 심을까요?',
  prev: '이전 씨앗',
  next: '다음 씨앗',
  legend: '씨앗 고르기',
  heroLabel: '고른 씨앗의 열매. 잡고 좌우로 끌면 돌아가요',
  note: { apple: '아삭하고 단단해요.', tangerine: '새콤달콤해요.', peach: '보송보송 달콤해요.', coffee: '진한 향이 나요.' },
  plant: (seed: SeedKey) => `${SEEDS[seed].label} 씨앗 심기`,
  planted: (seed: SeedKey) => `${SEEDS[seed].label} 씨앗을 심었어요`,
  plantedText: '출근할 때마다 조금씩 자라요.',
  plantedLabel: '파 놓은 흙에 씨앗이 떨어지고 작은 새싹이 올라오는 모습',
  toHome: '내 씨앗 보러 가기',
  again: '씨앗 다시 고르기',
} as const;
export const FRUIT_SCREEN = {
  eyebrow: 'Day 20',
  /** 두 줄 제목 */
  title: (seed: SeedKey) => ['내 씨앗이', `${SEEDS[seed].label}나무로 열렸어요`] as const,
  text: '고생했어요',
  close: '닫기',
  replay: '다시 보기',
  heroLabel: '꽃이 핀 나무에 열매가 하나씩 맺혀 과일나무가 되는 모습',
} as const;

/* ---------- 로그인·가입 (3.3, 3.4) ---------- */
export const FIELD = {
  name: { label: '이름', placeholder: '캠프에서 쓰는 이름' },
  email: { label: '이메일', placeholder: 'name@example.com' },
  password: { label: '비밀번호', loginPlaceholder: '비밀번호', signupPlaceholder: '8자 이상' },
  passwordConfirm: { label: '비밀번호 확인', placeholder: '비밀번호를 한 번 더 입력' },
  seed: { label: '씨앗', help: '20일을 출근하면 이 열매가 열려요.' },
  plan: { label: '출근 플랜', help: '나중에 내 설정에서 바꿀 수 있어요.' },
} as const;
// 플랜 상자의 설명은 한 줄로 줄인다(3.4, 3.8)
const PLAN_SHORT: Record<PlanKey, string> = { light: '하루 이틀 나와요', steady: '사나흘 나와요', daily: '빠짐없이 나와요' };
export const planOptionDesc = (p: PlanKey) => `${PLAN_SHORT[p]} · 주간 목표 ${PLANS[p].goal}일`;

/** 비밀번호 칸의 눈 아이콘 버튼 (3.3) */
export const PASSWORD_TOGGLE = { show: '비밀번호 보기', hide: '비밀번호 숨기기' } as const;

export const LOGIN = {
  title: '로그인',
  lead: `출근한 날만큼 나무가 자라고, ${FRUIT_DAYS}일을 채우면 열매가 열려요.`,
  submit: '로그인',
  footPrefix: '처음이라면 ',
  footLink: '가입하기',
} as const;
export const SIGNUP = {
  title: '가입하기',
  lead: '가입하면 씨앗을 하나 골라 심어요. 출근한 날만큼 자라요.',
  submit: '가입하고 씨앗 고르기',
  footPrefix: '이미 가입했다면 ',
  footLink: '로그인',
  closed: `${koDay(SEASON.end)}로 시즌이 끝나 새로 가입할 수 없어요.`,
  welcome: (name: string, seed: SeedKey) => `${name}님, ${SEEDS[seed].label} 씨앗을 심었어요.`,
} as const;
export const ERRORS = {
  name: '이름을 2자 이상 입력해 주세요.',
  email: '이메일 형식을 확인해 주세요.',
  emailTaken: '이미 가입한 이메일이에요. 로그인해 주세요.',
  passwordEmpty: '비밀번호를 입력해 주세요.',
  passwordShort: '비밀번호는 8자 이상이어야 해요.',
  passwordConfirmEmpty: '비밀번호를 한 번 더 입력해 주세요.',
  passwordMismatch: '비밀번호가 일치하지 않아요.',
  credentials: '이메일 또는 비밀번호가 맞지 않아요.',
  seed: '씨앗을 하나 골라 주세요.',
  plan: '출근 플랜을 하나 골라 주세요.',
} as const;

/* ---------- 홈: 오늘 (3.5) ---------- */
export const TODAY = {
  greeting: (name: string) => `안녕하세요, ${name}님`,
  checkInTime: '출근 시간',
  checkOutTime: '퇴근 시간',
  noTime: '미기록',
  states: {
    before: { badge: '출근 전', button: '출근하기', hint: '출근하면 나무가 자라요.' },
    inCamp: { badge: '그라운드에 있어요', button: '퇴근하기', hint: '퇴근은 누르지 않아도 출근 기록은 그대로예요.' },
    left: { badge: '퇴근했어요', button: '퇴근 시간 다시 기록', hint: '오늘 출근을 기록했어요.' },
    rest: { badge: '쉬는 날', button: '오늘은 쉬는 날이에요', hint: '주말과 공휴일에는 출근을 기록하지 않아요.' },
    over: {
      badge: '시즌 종료',
      button: '시즌이 끝났어요',
      hint: `${koDay(SEASON.open)}부터 ${koDay(SEASON.end)}까지의 기록은 캘린더에서 볼 수 있어요.`,
    },
  },
  nextWorkday: (d: string) => ` 다음 출근일은 ${koDate(d)}이에요.`,
} as const;

/* ---------- 홈: 이번 주 (3.5) ---------- */
export const WEEK = {
  title: '이번 주',
  lastTitle: '마지막 주',
  today: '오늘',
  streak: (n: number) => `${n}주 연속으로 목표를 채웠어요`,
  dotLabel: (d: string, state: string) => `${WEEKDAYS[dow(d)]}요일 ${+d.slice(8, 10)}일, ${state}`,
  dotState: { done: '출근함', today: '오늘, 아직 출근 전', rest: '출근일 아님', missed: '출근 안 함', future: '아직 오지 않은 날' },
  text: {
    pre: `정식 시작은 ${koDate(SEASON.start)}이에요. 주간 목표는 그때부터 세요.`,
    overDone: (goal: number) => `마지막 주 목표 ${goal}일을 채웠어요.`,
    overNotDone: (count: number) => `마지막 주에는 ${count}일 출근했어요.`,
    noDays: '이번 주에는 출근할 수 있는 날이 없어요.',
    over: (count: number, goal: number) => `이번 주 ${count}일 출근했어요. 목표 ${goal}일을 넘겼어요.`,
    met: (goal: number) => `이번 주 목표 ${goal}일을 채웠어요.`,
    missed: '이번 주 목표는 놓쳤어요. 그래도 나온 날만큼 나무는 자라요.',
    none: (goal: number) => `이번 주 목표는 ${goal}일이에요. 아직 출근한 날이 없어요.`,
    progress: (count: number, need: number, goal: number) =>
      `이번 주 ${count}일 출근했어요. ${need}일 더 나오면 목표 ${goal}일을 채워요.`,
  },
} as const;

/* ---------- 홈: 내 나무 (3.5) ---------- */
export const TREE = {
  title: '내 씨앗',
  attendanceTime: '총 출근 시간',
  headline: {
    harvested: (seed: SeedKey) => `${SEEDS[seed].fruit}${SEEDS[seed].obj} 수확했어요`,
    canHarvest: '열매가 열렸어요',
    seed: '씨앗을 심었어요',
    toGo: (n: number) => `열매까지 ${n}일 남았어요`,
  },
  harvestedText: '수확 카드를 운영진에게 DM으로 보내면 커피 쿠폰으로 바꿔 드려요.',
  openCard: '수확 카드 보기',
  canHarvestTitle: '수확할 수 있어요',
  canHarvestDesc: '나무의 열매를 눌러 수확하세요. 커피 쿠폰으로 바꿀 수 있는 수확 카드가 나와요.',
  // 지금 모습을 말하듯 한 줄로. "단계"라는 말은 쓰지 않는다(3.5)
  nowLine: {
    seed: '아직 씨앗이에요. 첫 출근으로 싹을 틔워 주세요.',
    sprout: '아직 새싹이에요. 물을 더 줘서 가꿔 주세요.',
    sapling: '묘목으로 자랐어요. 꾸준히 물을 주면 나무가 돼요.',
    tree: '어느새 나무가 됐어요. 곧 꽃망울이 맺혀요.',
    flower: '지금은 꽃이 피었네요. 열매가 머지않았어요.',
    fruit: '열매가 열렸어요. 출근할 때마다 하나씩 더 열려요.',
  },
  /** 작은 글씨로 두는 둘째 줄: 출근한 날과 다음까지 남은 날 */
  nextLine: (days: number, next: string) => (days ? `출근 ${days}일 · ${next.replace(/\.$/, '')}` : next.replace(/\.$/, '')),
  fruitLine: (days: number, fruits: number) => `출근 ${days}일 · 열매 ${fruits}개`,
  /** 씨앗 칩을 누르면 뜨는 안내 */
  seedTip: (seed: SeedKey) => `${SEEDS[seed].label} 씨앗을 골랐어요.`,
  fruitTip: `열매는 출근 ${FRUIT_DAYS}일에 열려요.`,
  /** 출근한 순간 나무 위에 떠오르는 글 */
  plusDay: '+1일',
  plusFruit: '+1일 · 열매 +1',
  next: {
    sprout: () => '하루 나오면 새싹이 나요.',
    sapling: (n: number) => `${n}일 더 나오면 묘목으로 자라요.`,
    tree: (n: number) => `${n}일 더 나오면 나무가 돼요.`,
    flower: (n: number) => `${n}일 더 나오면 꽃이 펴요.`,
    fruit: (n: number) => `${n}일 더 나오면 열매가 열려요.`,
    over: `${koDay(SEASON.end)}로 시즌이 끝났어요.`,
  },
  short: (n: number) => `남은 출근일을 모두 나와도 열매까지는 ${n}일이 모자라요. 그래도 나무는 계속 자라요.`,
  trackLabel: (n: number) => `열매까지 ${FRUIT_DAYS}일 중 ${n}일`,
  trackDays: (n: number) => `${n}일`,
  figureLabel: (seed: SeedKey, days: number, stageOrHarvested: string) =>
    `내 ${SEEDS[seed].label}나무. 출근 ${days}일, ${stageOrHarvested}.`,
  stage: (label: string) => label,
  harvestedTag: '수확 완료',
  harvestButton: (seed: SeedKey) => `${SEEDS[seed].fruit} 수확하기`,
} as const;

/* ---------- 홈: 배지 (3.5) ---------- */
export const BADGES = {
  title: '배지',
  first: '첫 출근',
  week: '주간 목표',
  streak: (n: number) => `${n}주 연속`,
  streakNone: '연속 달성',
  ten: '10일 출근',
  harvest: '첫 수확',
  locked: '잠김',
  summary: (n: number) => [`${n}개를 모았어요.`, '남은 배지는 모으면 열려요.'] as const,
  summaryAll: '배지를 모두 모았어요.',
  summaryNone: '출근하면 배지가 하나씩 열려요.',
} as const;

/* ---------- 홈: 오늘 그라운드 (3.5) ---------- */
export const CAMP = {
  title: '오늘 그라운드',
  over: '시즌이 끝나서 오늘 출근 기록은 없어요.',
  rest: '오늘은 쉬는 날이라 출근 기록이 없어요.',
  empty: '아직 아무도 출근하지 않았어요. 오늘 첫 출근을 기록해 보세요.',
  // 몇 명이 그라운드에 있는지는 칩의 점으로 보이므로 문장은 출근 인원만(2026-11-20 사용자 지시)
  summary: (came: number) => `오늘 ${came}명이 출근했어요.`,
  inCampSr: ' 그라운드에 있음',
  toGarden: '모두의 과수원 보기',
} as const;

/* ---------- 캘린더 (3.6) ---------- */
export const CALENDAR = {
  title: '출근 캘린더',
  prev: '이전 달',
  next: '다음 달',
  today: '오늘',
  attended: '출근함',
  timeRange: (inT: string, outT: string | null) => `${inT} ~ ${outT ?? ''}`.trimEnd(),
  columns: { date: '날짜', in: '출근', out: '퇴근', stay: '머문 시간', cumulative: '누적 시간' },
  empty: '이 달에는 아직 출근 기록이 없어요. 출근하면 여기에 쌓여요.',
} as const;

/* ---------- 모두의 과수원 (3.7) ---------- */
export const GARDEN = {
  title: '모두의 과수원',
  harvestedSome: (n: number) => `지금까지 ${n}명이 열매를 수확했어요.`,
  harvestedNone: '아직 열매를 수확한 사람은 없어요.',
  workday: (total: number, came: number, hv: string) => `오늘 ${total}명 중 ${came}명이 출근했어요. ${hv}`,
  rest: (hv: string) => `오늘은 쉬는 날이에요. ${hv}`,
  over: (hv: string) => `시즌이 끝났어요. ${hv}`,
  me: '나',
  harvested: '수확 완료',
  inCamp: '그라운드에 있어요',
  left: '퇴근했어요',
  count: (days: number, stage: string) => `출근 ${days}일, ${stage} 단계`,
  countHarvested: (days: number) => `출근 ${days}일, 수확 완료`,
  streak: (n: number) => `${n}주 연속 달성`,
  figureLabel: (name: string, seed: SeedKey, days: number) => `${name}님의 ${SEEDS[seed].label}나무. 출근 ${days}일.`,
} as const;

/* ---------- 내 설정 (3.8) ---------- */
export const SETTINGS = {
  title: '프로필',
  close: '닫기',
  seedHelp: '씨앗을 바꿔도 자란 만큼은 그대로예요.',
  seedLocked: '수확한 뒤에는 씨앗을 바꿀 수 없어요.',
  planHelp: '플랜을 바꾸면 주간 목표가 새 플랜 기준으로 다시 계산돼요. 나무는 그대로예요.',
  cancel: '취소',
  save: '저장하기',
  saved: '프로필을 저장했어요.',
  signOut: '로그아웃',
} as const;

/* ---------- 수확 카드 (3.9, 4.7) ---------- */
export const CARD = {
  title: '수확 카드',
  close: '닫기',
  save: '저장하기',
  saved: '카드를 저장했어요',
  saveFailed: '저장하지 못했어요. 화면을 캡처해 보내 주세요.',
  fileName: (date: string) => `harvest-${date}.png`,
  alt: (name: string, seed: SeedKey, days: number, plan: PlanKey, harvested: string) =>
    `${name}님의 수확 카드. ${SEEDS[seed].fruit}, 총 출근 ${days}일, 출근 플랜 ${PLANS[plan].label}, 수확한 날 ${md(harvested)}.`,
  // 카드 이미지 안의 글자
  brand: APP_NAME,
  tag: '수확 카드',
  heading: (name: string, seed: SeedKey) => `${name}님의 ${SEEDS[seed].fruit}`,
  sub: (days: number) => `${days}일 출근해서 열매를 수확했어요`,
  cells: { days: '총 출근', plan: '출근 플랜', first: '첫 출근', harvested: '수확한 날' },
  daysValue: (n: number) => `${n}일`,
  record: (total: number, days: number) => `출근일 ${total}일 중 ${days}일`,
  percent: (n: number) => `${n}%`,
  foot: '이 이미지를 운영진에게 DM으로 보내 주세요',
} as const;

/* ---------- 서버 동작의 토스트와 거절 문구 (8장) ---------- */
export const ACTION = {
  failed: '저장하지 못했어요. 잠시 후 다시 시도해 주세요.',
  rateLimited: '요청이 많아 잠시 기다려야 해요. 잠시 후 다시 시도해 주세요.',
  signedUpLoginLater: '가입은 끝났어요. 잠시 후 로그인해 주세요.',
  notWorkday: '오늘은 출근을 기록할 수 없는 날이에요.',
  checkInFirst: '먼저 출근을 기록해 주세요.',
  notRipe: '아직 열매가 열리지 않았어요.',
  checkedOut: '퇴근 시간을 기록했어요.',
  checkIn: {
    fruit: '열매가 열렸어요. 나무의 열매를 눌러 수확하세요.',
    stage: { sprout: '새싹이 났어요.', sapling: '묘목으로 자랐어요.', tree: '나무가 됐어요.', flower: '꽃이 폈어요.' },
    weekDone: '출근을 기록했어요. 이번 주 목표도 달성했어요.',
    plain: '출근을 기록했어요.',
    grew: '출근을 기록했어요. 나무가 조금 자랐어요.',
  },
} as const;

/* ---------- 위치 확인 (2.8) ---------- */
const meters = (m: number) => (m >= 1000 ? `${(m / 1000).toFixed(1)}km` : `${Math.round(m / 10) * 10}m`);
export const LOCATION = {
  denied: '위치 권한을 허용해야 출근과 퇴근을 기록할 수 있어요. 브라우저 설정에서 위치를 허용해 주세요.',
  unavailable: '지금 위치를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.',
  outside: (distance: number, radius: number) => `그라운드에서 ${meters(distance)} 떨어져 있어요. 그라운드 ${radius}m 안에서 기록할 수 있어요.`,
} as const;

/* ---------- 불러오기와 오류 화면 (9.4) ---------- */
export const ERROR_PAGE = { title: '화면을 불러오지 못했어요', desc: '잠시 후 다시 시도해 주세요.', retry: '다시 시도' } as const;
export const NOT_FOUND = { title: '찾는 화면이 없어요', home: '홈으로 가기' } as const;
