// 화면과 서버 액션이 데이터를 읽고 쓰는 함수 (spec 7.5, 12.6). 데이터는 이 파일의 함수로만 다룬다.
// 3단계: fixtures를 개발 서버 메모리에 두고 쓴다. 서버를 다시 켜면 처음 상태로 돌아간다.
// 4단계: 같은 함수 이름을 유지한 채 Supabase 구현으로 바꾼다.
import 'server-only';

import { cookies } from 'next/headers';

import { createFixtures, type FixtureAccount } from './fixtures';
import { serverNow, serverToday } from './time';
import type { Attendance, PlanKey, Profile, SeedKey } from './types';

type Store = { profiles: Profile[]; attendance: Attendance[]; accounts: FixtureAccount[] };
const g = globalThis as unknown as { __yeolmaeFixtures?: Store };
const store = () => (g.__yeolmaeFixtures ??= createFixtures());

const SESSION_COOKIE = 'yeolmae-fixture-session';

/* ---------- 세션 (3단계 임시. 4단계에서 Supabase Auth로 바꾼다) ---------- */

export async function getSessionUserId(): Promise<string | null> {
  const id = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  return id && store().profiles.some(p => p.id === id) ? id : null;
}

export async function setSession(userId: string | null) {
  const jar = await cookies();
  if (userId) jar.set(SESSION_COOKIE, userId, { httpOnly: true, sameSite: 'lax', path: '/' });
  else jar.delete(SESSION_COOKIE);
}

export async function verifyCredentials(email: string, password: string): Promise<string | null> {
  const acc = store().accounts.find(a => a.email === email);
  return acc && acc.password === password ? acc.userId : null;
}

export async function emailExists(email: string) {
  return store().accounts.some(a => a.email === email);
}

/* ---------- 읽기 ---------- */

// fixtures에는 시즌 전체 기록이 들어 있으므로, 서버의 지금보다 뒤의 기록은 아직 없는 것으로 본다
const visible = (r: Attendance, today: string, now: string): Attendance | null => {
  if (r.workDate > today) return null;
  if (r.workDate < today) return r;
  if (r.checkInAt && r.checkInAt > now) return null;
  return r.checkOutAt && r.checkOutAt > now ? { ...r, checkOutAt: null } : r;
};
const visibleAll = (rows: Attendance[]) => {
  const today = serverToday();
  const now = serverNow();
  return rows.map(r => visible(r, today, now)).filter((r): r is Attendance => r !== null);
};
const visibleProfile = (p: Profile): Profile =>
  p.harvestedAt && p.harvestedAt > serverNow() ? { ...p, harvestedAt: null } : p;

export async function getProfile(id: string): Promise<Profile | null> {
  const p = store().profiles.find(x => x.id === id);
  return p ? visibleProfile(p) : null;
}

export async function listProfiles(): Promise<Profile[]> {
  return store().profiles.map(visibleProfile);
}

/** 한 사람의 출근 기록 전체, 날짜 오름차순 */
export async function listAttendanceOf(userId: string): Promise<Attendance[]> {
  return visibleAll(store().attendance.filter(r => r.userId === userId)).sort((a, b) => a.workDate.localeCompare(b.workDate));
}

/** 그날의 출근 기록 전체 */
export async function listAttendanceOn(date: string): Promise<Attendance[]> {
  return visibleAll(store().attendance.filter(r => r.workDate === date));
}

/** 모든 구성원의 출근 기록 전체 */
export async function listAllAttendance(): Promise<Attendance[]> {
  return visibleAll(store().attendance);
}

/* ---------- 쓰기 (서버 액션만 부른다) ---------- */

export async function createMember(input: { name: string; email: string; password: string; plan: PlanKey; seed: SeedKey; joinDate: string }) {
  const id = `u${Date.now().toString(36)}`;
  store().accounts.push({ email: input.email, password: input.password, userId: id });
  store().profiles.push({ id, name: input.name, plan: input.plan, seed: input.seed, joinDate: input.joinDate, harvestedAt: null });
  return id;
}

/** 오늘 기록이 이미 있으면 아무것도 바꾸지 않고 false */
export async function insertCheckIn(userId: string, date: string, at: string): Promise<boolean> {
  const s = store();
  // 미래 fixtures 기록이 남아 있으면 지운다(3단계 전용)
  const i = s.attendance.findIndex(r => r.userId === userId && r.workDate === date);
  if (i >= 0) {
    if (visible(s.attendance[i], date, at)) return false;
    s.attendance.splice(i, 1);
  }
  s.attendance.push({ userId, workDate: date, checkInAt: at, checkOutAt: null });
  return true;
}

export async function updateCheckOut(userId: string, date: string, at: string) {
  const r = store().attendance.find(x => x.userId === userId && x.workDate === date);
  if (r) r.checkOutAt = at;
}

/** 이미 수확했으면 그 시각을 그대로 돌려준다 */
export async function markHarvested(userId: string, at: string): Promise<string> {
  const p = store().profiles.find(x => x.id === userId)!;
  const cur = visibleProfile(p).harvestedAt;
  if (cur) return cur;
  p.harvestedAt = at;
  return at;
}

export async function updateProfileRow(id: string, patch: Partial<Pick<Profile, 'name' | 'plan' | 'seed'>>) {
  const p = store().profiles.find(x => x.id === id);
  if (p) Object.assign(p, patch);
}
