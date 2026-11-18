// 화면 개발과 테스트용 가짜 데이터 (spec 13.2). 4단계에서 Supabase로 바꾸면 쓰지 않는다.
// 구성원 이름은 모두 지어낸 것이다. 예시 계정(demo)은 spec 2.6의 첫 예시와 같다.
import { ALL_WORKDAYS, FRUIT_DAYS, PLANS, SEASON, type SEEDS, addDays, weekStart, workdaysOfWeek } from './rules';
import type { Attendance, Profile } from './types';

type PlanKey = keyof typeof PLANS;
type SeedKey = keyof typeof SEEDS;

/** 3단계 로그인용 테스트 계정 비밀번호. 모든 fixtures 계정이 같다 */
export const FIXTURE_PASSWORD = 'yeolmae1234';
export const DEMO_EMAIL = 'demo@yeolmae.example';

const kst = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00+09:00`).toISOString();

// spec 2.6 "예시 기록" 19일과 그날의 출근·퇴근 시각
const DEMO_HISTORY: [string, string, string][] = [
  ['2026-11-18', '09:48', '18:32'], ['2026-11-19', '09:51', '19:02'], ['2026-11-20', '10:02', '17:45'],
  ['2026-11-23', '09:50', '19:00'], ['2026-11-24', '09:46', '19:03'], ['2026-11-25', '09:55', '18:40'],
  ['2026-11-26', '09:58', '18:21'], ['2026-11-27', '10:00', '19:02'],
  ['2026-11-30', '09:52', '19:04'], ['2026-12-01', '09:43', '18:50'], ['2026-12-02', '09:49', '18:12'], ['2026-12-04', '10:05', '17:58'],
  ['2026-12-07', '09:47', '19:01'], ['2026-12-08', '09:53', '18:44'], ['2026-12-10', '09:41', '18:59'], ['2026-12-11', '09:56', '17:30'],
  ['2026-12-14', '09:50', '18:47'], ['2026-12-15', '09:44', '19:05'], ['2026-12-16', '09:52', '18:36'],
];

// [id, 이름, 플랜, 씨앗, 주간 목표보다 더 나올 확률, 덜 나올 확률, 사전 기간 출근, 20일이 되면 수확]
const MEMBERS: [string, string, PlanKey, SeedKey, number, number, boolean, boolean][] = [
  ['m01', '김서연', 'daily', 'peach', 0, 0.1, true, true],
  ['m02', '이도윤', 'steady', 'coffee', 0.5, 0.1, false, false],
  ['m03', '박지호', 'light', 'apple', 0.5, 0.15, false, false],
  ['m04', '최유진', 'steady', 'tangerine', 0.4, 0.2, true, false],
  ['m05', '정하람', 'daily', 'apple', 0, 0.3, true, false],
  ['m06', '강민서', 'light', 'peach', 0.6, 0.1, false, false],
  ['m07', '윤태오', 'steady', 'apple', 0.6, 0.05, true, true],
  ['m08', '임수아', 'daily', 'coffee', 0, 0.05, true, true],
];

// 시드가 같으면 항상 같은 값을 내는 난수
function hash(str: string) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}
function rand(seed: string) {
  let a = hash(seed);
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hm = (min: number) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

function memberRecords(id: string, plan: PlanKey, extra: number, miss: number, early: boolean): Attendance[] {
  const out: Attendance[] = [];
  const weeks = [...new Set(ALL_WORKDAYS.map(weekStart))];
  for (const w of weeks) {
    const rng = rand(`${id}|${w}`);
    const pre = w < weekStart(SEASON.start);
    const days = workdaysOfWeek(w, pre ? SEASON.open : SEASON.start);
    let k = pre
      ? (early ? 1 + Math.floor(rng() * days.length) : 0)
      : PLANS[plan].goal + (rng() < extra ? 1 : 0) - (rng() < miss ? 1 : 0);
    k = Math.max(0, Math.min(days.length, k));
    const picked = days.map(d => [rng(), d] as const).sort((a, b) => a[0] - b[0]).slice(0, k).map(x => x[1]);
    for (const d of picked) {
      const inMin = 560 + Math.floor(rng() * 70);           // 09:20 ~ 10:29
      const outMin = rng() < 0.12 ? null : 1060 + Math.floor(rng() * 110); // 17:40 ~ 19:29, 12%는 퇴근 안 누름
      out.push({ userId: id, workDate: d, checkInAt: kst(d, hm(inMin)), checkOutAt: outMin == null ? null : kst(d, hm(outMin)) });
    }
  }
  return out.sort((a, b) => a.workDate.localeCompare(b.workDate));
}

export type FixtureAccount = { email: string; password: string; userId: string };

export function createFixtures() {
  const profiles: Profile[] = [];
  const attendance: Attendance[] = [];
  const accounts: FixtureAccount[] = [];

  profiles.push({ id: 'demo', name: '고준', plan: 'steady', seed: 'apple', joinDate: SEASON.open, harvestedAt: null });
  accounts.push({ email: DEMO_EMAIL, password: FIXTURE_PASSWORD, userId: 'demo' });
  for (const [d, i, o] of DEMO_HISTORY) attendance.push({ userId: 'demo', workDate: d, checkInAt: kst(d, i), checkOutAt: kst(d, o) });

  for (const [id, name, plan, seed, extra, miss, early, harvests] of MEMBERS) {
    const recs = memberRecords(id, plan, extra, miss, early);
    const ripe = recs[FRUIT_DAYS - 1]?.workDate;
    profiles.push({ id, name, plan, seed, joinDate: SEASON.open, harvestedAt: harvests && ripe ? kst(addDays(ripe, 0), '18:10') : null });
    accounts.push({ email: `${id}@yeolmae.example`, password: FIXTURE_PASSWORD, userId: id });
    attendance.push(...recs);
  }
  return { profiles, attendance, accounts };
}
