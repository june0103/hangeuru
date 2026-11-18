'use server';

// 서버 액션 7개 (spec 8장). 화면이 버튼을 막아도 서버는 조건을 처음부터 다시 검사한다.
// 3단계에서는 lib/data.ts가 fixtures를 쓰므로 개발 서버 메모리만 바뀐다. 4단계에서 Supabase로 바꾼다.
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { ACTION, ERRORS, SETTINGS } from '@/lib/copy';
import {
  createMember, emailExists, getProfile, getSessionUserId, insertCheckIn, listAttendanceOf, markHarvested,
  setSession, updateCheckOut, updateProfileRow, verifyCredentials,
} from '@/lib/data';
import { FRUIT_DAYS, PLANS, SEASON, SEEDS, isWorkday } from '@/lib/rules';
import { serverNow, serverToday } from '@/lib/time';
import type { ActionResult, PlanKey, SeedKey } from '@/lib/types';
import { checkInMessage, statsOf } from '@/lib/view';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const str = (f: FormData, k: string) => String(f.get(k) ?? '');
const validName = (name: string) => name.length >= 2 && name.length <= 20;
const isPlan = (v: string): v is PlanKey => v in PLANS;
const isSeed = (v: string): v is SeedKey => v in SEEDS;

async function requireUser() {
  const id = await getSessionUserId();
  if (!id) redirect('/login');
  const me = await getProfile(id);
  if (!me) redirect('/login');
  return me;
}

const done = (r: ActionResult) => {
  revalidatePath('/', 'layout');
  return r;
};

export async function signUp(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  if (serverToday() > SEASON.end) return { ok: false, message: ACTION.failed };
  const name = str(f, 'name').trim();
  const email = str(f, 'email').trim().toLowerCase();
  const password = str(f, 'password');
  const seed = str(f, 'seed');
  const plan = str(f, 'plan');
  const errors: Record<string, string> = {};
  if (!validName(name)) errors.name = ERRORS.name;
  if (!EMAIL_RE.test(email)) errors.email = ERRORS.email;
  else if (await emailExists(email)) errors.email = ERRORS.emailTaken;
  if (password.length < 8) errors.password = ERRORS.passwordShort;
  if (!isSeed(seed)) errors.seed = ERRORS.seed;
  if (!isPlan(plan)) errors.plan = ERRORS.plan;
  if (Object.keys(errors).length || !isSeed(seed) || !isPlan(plan)) return { ok: false, errors };
  const id = await createMember({ name, email, password, plan, seed, joinDate: serverToday() });
  await setSession(id);
  revalidatePath('/', 'layout');
  redirect('/?welcome=1');
}

export async function signIn(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const email = str(f, 'email').trim().toLowerCase();
  const password = str(f, 'password');
  const errors: Record<string, string> = {};
  if (!EMAIL_RE.test(email)) errors.email = ERRORS.email;
  if (!password) errors.password = ERRORS.passwordEmpty;
  if (Object.keys(errors).length) return { ok: false, errors };
  const id = await verifyCredentials(email, password);
  if (!id) return { ok: false, errors: { password: ERRORS.credentials } };
  await setSession(id);
  revalidatePath('/', 'layout');
  redirect('/');
}

export async function signOut() {
  await setSession(null);
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function checkIn(): Promise<ActionResult> {
  const me = await requireUser();
  const today = serverToday();
  if (!isWorkday(today)) return { ok: false, message: ACTION.notWorkday };
  const before = statsOf(me, await listAttendanceOf(me.id), today);
  const inserted = await insertCheckIn(me.id, today, serverNow());
  if (!inserted) return done({ ok: true });
  const after = statsOf(me, await listAttendanceOf(me.id), today);
  return done({ ok: true, message: checkInMessage(before, after) });
}

export async function checkOut(): Promise<ActionResult> {
  const me = await requireUser();
  const today = serverToday();
  const rec = (await listAttendanceOf(me.id)).find(r => r.workDate === today);
  if (!rec?.checkInAt) return { ok: false, message: ACTION.checkInFirst };
  await updateCheckOut(me.id, today, serverNow());
  return done({ ok: true, message: ACTION.checkedOut });
}

export async function harvest(): Promise<ActionResult> {
  const me = await requireUser();
  const st = statsOf(me, await listAttendanceOf(me.id), serverToday());
  if (st.days < FRUIT_DAYS) return { ok: false, message: ACTION.notRipe };
  const harvestedAt = await markHarvested(me.id, serverNow());
  return done({ ok: true, harvestedAt });
}

export async function updateProfile(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  const me = await requireUser();
  const name = str(f, 'name').trim();
  const plan = str(f, 'plan');
  const seed = str(f, 'seed');
  if (!validName(name)) return { ok: false, errors: { name: ERRORS.name } };
  if (!isPlan(plan)) return { ok: false, message: ACTION.failed };
  await updateProfileRow(me.id, { name, plan, ...(isSeed(seed) && !me.harvestedAt ? { seed } : {}) });
  return done({ ok: true, message: SETTINGS.saved });
}
