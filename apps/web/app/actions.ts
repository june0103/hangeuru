'use server';

// 서버 액션 7개 (spec 8장). 화면이 버튼을 막아도 서버는 조건을 처음부터 다시 검사한다.
// 읽기와 쓰기는 lib/data.ts를 거친다. 쓰기는 secret key 클라이언트로만 한다.
import { revalidatePath } from 'next/cache';
import { redirect, unstable_rethrow } from 'next/navigation';

import { ACTION, ERRORS, SETTINGS } from '@/lib/copy';
import {
  createAuthUser, deleteAuthUser, getProfile, getSessionUserId, insertCheckIn, insertProfile, listAttendanceOf, markHarvested,
  signInWithPassword, signOutSession, updateCheckOut, updateProfileRow,
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

// 예상하지 못한 실패는 공통 문구로 돌려준다(spec 8.1). redirect()가 던지는 신호는 unstable_rethrow로 다시 던진다
async function guard(fn: () => Promise<ActionResult>): Promise<ActionResult> {
  try {
    return await fn();
  } catch (e) {
    unstable_rethrow(e);
    console.error(e);
    return { ok: false, message: ACTION.failed };
  }
}

export async function signUp(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  return guard(async () => {
    if (serverToday() > SEASON.end) return { ok: false, message: ACTION.failed };
    const name = str(f, 'name').trim();
    const email = str(f, 'email').trim().toLowerCase();
    const password = str(f, 'password');
    const seed = str(f, 'seed');
    const plan = str(f, 'plan');
    const errors: Record<string, string> = {};
    if (!validName(name)) errors.name = ERRORS.name;
    if (!EMAIL_RE.test(email)) errors.email = ERRORS.email;
    if (password.length < 8) errors.password = ERRORS.passwordShort;
    if (!isSeed(seed)) errors.seed = ERRORS.seed;
    if (!isPlan(plan)) errors.plan = ERRORS.plan;
    if (Object.keys(errors).length || !isSeed(seed) || !isPlan(plan)) return { ok: false, errors };

    const user = await createAuthUser(email, password);
    if (user === 'taken') return { ok: false, errors: { email: ERRORS.emailTaken } };
    try {
      await insertProfile({ id: user.id, name, plan, seed, joinDate: serverToday() });
    } catch (e) {
      await deleteAuthUser(user.id);
      throw e;
    }
    if (!(await signInWithPassword(email, password))) return { ok: false, message: ACTION.failed };
    revalidatePath('/', 'layout');
    redirect('/?welcome=1');
  });
}

export async function signIn(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  return guard(async () => {
    const email = str(f, 'email').trim().toLowerCase();
    const password = str(f, 'password');
    const errors: Record<string, string> = {};
    if (!EMAIL_RE.test(email)) errors.email = ERRORS.email;
    if (!password) errors.password = ERRORS.passwordEmpty;
    if (Object.keys(errors).length) return { ok: false, errors };
    // 실패 이유와 상관없이 같은 문구로 돌려줘 가입된 이메일인지 알 수 없게 한다(spec 8.3)
    if (!(await signInWithPassword(email, password))) return { ok: false, errors: { password: ERRORS.credentials } };
    revalidatePath('/', 'layout');
    redirect('/');
  });
}

export async function signOut() {
  await signOutSession();
  revalidatePath('/', 'layout');
  redirect('/login');
}

export async function checkIn(): Promise<ActionResult> {
  return guard(async () => {
    const me = await requireUser();
    const today = serverToday();
    if (!isWorkday(today)) return { ok: false, message: ACTION.notWorkday };
    const before = statsOf(me, await listAttendanceOf(me.id), today);
    const inserted = await insertCheckIn(me.id, today, serverNow());
    if (!inserted) return done({ ok: true });
    const after = statsOf(me, await listAttendanceOf(me.id), today);
    return done({ ok: true, message: checkInMessage(before, after) });
  });
}

export async function checkOut(): Promise<ActionResult> {
  return guard(async () => {
    const me = await requireUser();
    const today = serverToday();
    const rec = (await listAttendanceOf(me.id)).find(r => r.workDate === today);
    if (!rec?.checkInAt) return { ok: false, message: ACTION.checkInFirst };
    await updateCheckOut(me.id, today, serverNow());
    return done({ ok: true, message: ACTION.checkedOut });
  });
}

export async function harvest(): Promise<ActionResult> {
  return guard(async () => {
    const me = await requireUser();
    const st = statsOf(me, await listAttendanceOf(me.id), serverToday());
    if (st.days < FRUIT_DAYS) return { ok: false, message: ACTION.notRipe };
    const harvestedAt = await markHarvested(me.id, serverNow());
    return done({ ok: true, harvestedAt });
  });
}

export async function updateProfile(_: ActionResult | null, f: FormData): Promise<ActionResult> {
  return guard(async () => {
    const me = await requireUser();
    const name = str(f, 'name').trim();
    const plan = str(f, 'plan');
    const seed = str(f, 'seed');
    if (!validName(name)) return { ok: false, errors: { name: ERRORS.name } };
    if (!isPlan(plan)) return { ok: false, message: ACTION.failed };
    await updateProfileRow(me.id, { name, plan, ...(isSeed(seed) && !me.harvestedAt ? { seed } : {}) });
    return done({ ok: true, message: SETTINGS.saved });
  });
}
