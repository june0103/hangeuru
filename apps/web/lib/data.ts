// 화면과 서버 액션이 데이터를 읽고 쓰는 함수 (spec 6.5, 7.5, 12.6). 데이터는 이 파일의 함수로만 다룬다.
// 읽기: 로그인한 사용자의 세션 클라이언트(행 수준 보안 적용). 쓰기: secret key 클라이언트(서버 액션에서만 부른다).
import 'server-only';

import { cache } from 'react';

import { createAdminClient } from './supabase/admin';
import { createClient } from './supabase/server';
import type { Attendance, PlanKey, Profile, SeedKey } from './types';

type ProfileRow = { id: string; name: string; plan: PlanKey; seed: SeedKey; join_date: string; harvested_at: string | null };
type AttendanceRow = { user_id: string; work_date: string; check_in_at: string | null; check_out_at: string | null };

const PROFILE_COLS = 'id, name, plan, seed, join_date, harvested_at';
const ATTENDANCE_COLS = 'user_id, work_date, check_in_at, check_out_at';
const PAGE = 1000;

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id, name: r.name, plan: r.plan, seed: r.seed, joinDate: r.join_date, harvestedAt: r.harvested_at,
});
const toAttendance = (r: AttendanceRow): Attendance => ({
  userId: r.user_id, workDate: r.work_date, checkInAt: r.check_in_at, checkOutAt: r.check_out_at,
});

function must<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data as T;
}

/* ---------- 세션과 계정 ---------- */

/** 로그인한 사용자 id. 서버에서는 getClaims()로만 확인한다(getSession은 믿지 않는다) */
// 한 요청 안에서는 한 번만 확인한다(레이아웃과 페이지가 같이 부른다, spec 6.5)
export const getSessionUserId = cache(async (): Promise<string | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
});

/** 성공하면 로그인 쿠키를 심고 'ok'. Supabase 로그인 횟수 제한(429)에 걸리면 'rate_limited' */
export async function signInWithPassword(email: string, password: string): Promise<'ok' | 'rate_limited' | 'failed'> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (!error) return 'ok';
  return error.status === 429 || error.code === 'over_request_rate_limit' ? 'rate_limited' : 'failed';
}

export async function signOutSession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

/** 이메일 확인이 끝난 상태로 사용자를 만든다(spec 8.3). 이미 있는 이메일이면 'taken' */
export async function createAuthUser(email: string, password: string): Promise<{ id: string } | 'taken'> {
  const { data, error } = await createAdminClient().auth.admin.createUser({ email, password, email_confirm: true });
  if (error) {
    if (error.code === 'email_exists' || error.status === 422) return 'taken';
    throw error;
  }
  return { id: data.user.id };
}

export async function deleteAuthUser(id: string) {
  await createAdminClient().auth.admin.deleteUser(id);
}

/* ---------- 읽기 ---------- */

// 한 요청 안에서는 한 번만 읽는다(spec 6.5)
export const getProfile = cache(async (id: string): Promise<Profile | null> => {
  const supabase = await createClient();
  const row = must(await supabase.from('profiles').select(PROFILE_COLS).eq('id', id).maybeSingle<ProfileRow>());
  return row ? toProfile(row) : null;
});

export async function listProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const rows: ProfileRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = must(await supabase.from('profiles').select(PROFILE_COLS).order('id').range(from, from + PAGE - 1).returns<ProfileRow[]>());
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows.map(toProfile);
}

/** 한 사람의 출근 기록 전체, 날짜 오름차순 */
export async function listAttendanceOf(userId: string): Promise<Attendance[]> {
  const supabase = await createClient();
  return must(await supabase.from('attendance').select(ATTENDANCE_COLS).eq('user_id', userId).order('work_date').returns<AttendanceRow[]>())
    .map(toAttendance);
}

/** 그날의 출근 기록 전체 */
export async function listAttendanceOn(date: string): Promise<Attendance[]> {
  const supabase = await createClient();
  return must(await supabase.from('attendance').select(ATTENDANCE_COLS).eq('work_date', date).returns<AttendanceRow[]>()).map(toAttendance);
}

/** 모든 구성원의 출근 기록 전체. 1,000행씩 나눠 끝까지 읽는다(spec 6.5) */
export async function listAllAttendance(): Promise<Attendance[]> {
  const supabase = await createClient();
  const rows: AttendanceRow[] = [];
  for (let from = 0; ; from += PAGE) {
    const page = must(await supabase.from('attendance').select(ATTENDANCE_COLS)
      .order('work_date').order('user_id').range(from, from + PAGE - 1).returns<AttendanceRow[]>());
    rows.push(...page);
    if (page.length < PAGE) break;
  }
  return rows.map(toAttendance);
}

/* ---------- 쓰기 (서버 액션만 부른다) ---------- */

export async function insertProfile(p: Omit<Profile, 'harvestedAt'>) {
  must(await createAdminClient().from('profiles').insert({ id: p.id, name: p.name, plan: p.plan, seed: p.seed, join_date: p.joinDate }));
}

/** 오늘 기록이 이미 있으면 아무것도 바꾸지 않고 false. 두 기기에서 동시에 눌러도 1건만 남는다 */
export async function insertCheckIn(userId: string, date: string, at: string): Promise<boolean> {
  const rows = must(await createAdminClient().from('attendance')
    .upsert({ user_id: userId, work_date: date, check_in_at: at }, { onConflict: 'user_id,work_date', ignoreDuplicates: true })
    .select('user_id'));
  return rows.length > 0;
}

export async function updateCheckOut(userId: string, date: string, at: string) {
  must(await createAdminClient().from('attendance').update({ check_out_at: at }).eq('user_id', userId).eq('work_date', date));
}

/** 이미 수확했으면 먼저 저장된 시각을 그대로 돌려준다 */
export async function markHarvested(userId: string, at: string): Promise<string> {
  const admin = createAdminClient();
  const updated = must(await admin.from('profiles').update({ harvested_at: at }).eq('id', userId).is('harvested_at', null).select('harvested_at'));
  if (updated.length) return updated[0].harvested_at as string;
  const row = must(await admin.from('profiles').select('harvested_at').eq('id', userId).single<{ harvested_at: string }>());
  return row.harvested_at;
}

export async function updateProfileRow(id: string, patch: Partial<Pick<Profile, 'name' | 'plan' | 'seed'>>) {
  must(await createAdminClient().from('profiles').update(patch).eq('id', id));
}
