// docs/spec.md 2.5의 기준 코드. 예시 사이트에서 검증한 코드라 그대로 옮긴다. 규칙 계산은 이 파일에만 둔다
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

// 2.8 위치 확인. 그라운드 반경 안에서만 출근·퇴근을 기록한다
export const CAMP = { lat: 37.504, lng: 127.1042, radiusM: 500 } as const;

/** 두 지점 사이 거리(m). 하버사인 공식 */
export function distanceM(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** 그라운드(교육장)까지의 거리와 반경 안인지 */
export function campCheck(pos: { lat: number; lng: number }) {
  const d = distanceM(pos, CAMP);
  return { distance: d, inside: d <= CAMP.radiusM };
}
