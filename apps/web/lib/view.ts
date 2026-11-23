// 규칙(lib/rules.ts)과 문구(lib/copy.ts)를 합쳐 화면이 그대로 그릴 값을 만든다.
// 패널 컴포넌트는 여기서 만든 값만 props로 받고, 날짜나 목표를 다시 계산하지 않는다(spec 12.6).
import {
  ACTION, BADGES, CALENDAR, CAMP, CARD, DASH, GARDEN, TODAY, TREE, WEEK, WEEKDAYS,
  koDate, koDay, koDuration, koMonth, planLabel, seedLabel,
} from './copy';
import {
  ALL_WORKDAYS, FRUIT_DAYS, HOLIDAYS, SEASON, STAGES, addDays, computeStats, demoStats, dow, fruitCount, growth, isWorkday,
  stayDurationMs, weekStart, workdaysLeft, workdaysOfWeek,
} from './rules';
import { hhmmKST, todayKST } from './time';
import type { Attendance, Member, PlanKey, Profile, SeedKey } from './types';

type Stats = ReturnType<typeof computeStats>;

// 시연 계정(spec 2.9)만 20일로 채워 계산한다. DEMO_USER_ID는 서버 전용 환경 변수다
export const statsOf = (p: Profile, records: Attendance[], today: string) => {
  const demoId = process.env.DEMO_USER_ID;
  return (demoId && p.id === demoId ? demoStats : computeStats)(p.plan, p.joinDate, records.map(r => r.workDate), today);
};

/** 씨앗을 심은 구성원인지 */
export const isMember = (p: Profile): p is Member => p.seed !== null;

const nextWorkday = (s: string) => ALL_WORKDAYS.find(d => d > s) ?? null;

/* ================= 홈 ================= */

export type MainAction = 'checkIn' | 'checkOut' | null;
export type TodayView = {
  greetingName: string;
  dateText: string;
  badge: { text: string; tone: 'neutral' | 'lime' };
  button: { label: string; variant: 'solid' | 'outlined'; color: 'primary' | 'assistive'; action: MainAction };
  hint: string;
  checkIn: string | null;
  checkOut: string | null;
};

export function todayView(me: Profile, todayRecord: Attendance | null, today: string): TodayView {
  const base = { greetingName: me.name, dateText: koDate(today), checkIn: null, checkOut: null };
  const times = {
    checkIn: todayRecord?.checkInAt ? hhmmKST(todayRecord.checkInAt) : null,
    checkOut: todayRecord?.checkOutAt ? hhmmKST(todayRecord.checkOutAt) : null,
  };
  const S = TODAY.states;
  if (today > SEASON.end) {
    return { ...base, ...times, badge: { text: S.over.badge, tone: 'neutral' }, hint: S.over.hint,
      button: { label: S.over.button, variant: 'solid', color: 'primary', action: null } };
  }
  if (!isWorkday(today)) {
    const nx = nextWorkday(today);
    return { ...base, ...times, badge: { text: S.rest.badge, tone: 'neutral' }, hint: S.rest.hint + (nx ? TODAY.nextWorkday(nx) : ''),
      button: { label: S.rest.button, variant: 'solid', color: 'primary', action: null } };
  }
  if (!todayRecord) {
    return { ...base, badge: { text: S.before.badge, tone: 'neutral' }, hint: S.before.hint,
      button: { label: S.before.button, variant: 'solid', color: 'primary', action: 'checkIn' } };
  }
  if (!todayRecord.checkOutAt) {
    return { ...base, ...times, badge: { text: S.inCamp.badge, tone: 'lime' }, hint: S.inCamp.hint,
      button: { label: S.inCamp.button, variant: 'solid', color: 'assistive', action: 'checkOut' } };
  }
  return { ...base, ...times, badge: { text: S.left.badge, tone: 'neutral' }, hint: S.left.hint,
    button: { label: S.left.button, variant: 'outlined', color: 'assistive', action: 'checkOut' } };
}

export type WeekDot = { date: string; weekday: string; dayNum: number; state: 'done' | 'today' | 'empty' | 'rest'; label: string };
export type WeekView = {
  title: string;
  planLabel: string;
  done: boolean;
  dots: WeekDot[];
  text: string;
  streakText: string | null;
};

export function weekView(me: Profile, st: Stats, today: string): WeekView | null {
  const over = today > SEASON.end;
  const pre = today < SEASON.start;
  const cur = st.cur ?? (pre ? { w: weekStart(today), days: workdaysOfWeek(weekStart(today), SEASON.open), goal: 0, count: 0, done: false } : null);
  if (!cur) return null;
  const has = new Set(st.dates);
  const dots: WeekDot[] = [];
  for (let i = 0; i < 5; i++) {
    const d = addDays(cur.w, i);
    let state: WeekDot['state'];
    let say: string;
    if (has.has(d)) { state = 'done'; say = WEEK.dotState.done; }
    else if (!cur.days.includes(d)) { state = 'rest'; say = HOLIDAYS[d] ?? WEEK.dotState.rest; }
    else if (d === today && !over) { state = 'today'; say = WEEK.dotState.today; }
    else { state = 'empty'; say = d < today ? WEEK.dotState.missed : WEEK.dotState.future; }
    dots.push({ date: d, weekday: WEEKDAYS[dow(d)], dayNum: +d.slice(8, 10), state, label: WEEK.dotLabel(d, say) });
  }
  const left = cur.days.filter(d => d > today || (d === today && !has.has(d))).length;
  const need = cur.goal - cur.count;
  const T = WEEK.text;
  let text: string;
  if (pre) text = T.pre;
  else if (over) text = cur.done ? T.overDone(cur.goal) : T.overNotDone(cur.count);
  else if (cur.goal === 0) text = T.noDays;
  else if (cur.count > cur.goal) text = T.over(cur.count, cur.goal);
  else if (cur.count === cur.goal) text = T.met(cur.goal);
  else if (need > left) text = T.missed;
  else if (cur.count === 0) text = T.none(cur.goal);
  else text = T.progress(cur.count, need, cur.goal);
  return {
    title: over ? WEEK.lastTitle : WEEK.title,
    planLabel: planLabel(me.plan),
    done: !pre && cur.done,
    dots,
    text,
    streakText: !pre && st.streak > 0 ? WEEK.streak(st.streak) : null,
  };
}

export type TrackStep = { label: string; from: number; at: number; reached: boolean; daysText: string };
export type TreeView = {
  seed: SeedKey;
  seedLabel: string;
  days: number;
  /** 나무에 달린 열매 수. 20일 전에는 0 (spec 2.3) */
  fruits: number;
  harvested: boolean;
  canHarvest: boolean;
  headline: string;
  figureLabel: string;
  harvestLabel: string;
  /** progress: now 는 지금 모습 한 줄, next 는 작은 글씨로 두는 둘째 줄 */
  lead: { kind: 'harvested' } | { kind: 'canHarvest' } | { kind: 'progress'; now: string; next: string };
  /** 열매가 열린 뒤의 작은 줄: 출근일과 열매 수. 그 전에는 null */
  count: string | null;
  short: string | null;
  /** 씨앗 칩을 누르면 뜨는 안내. 한 줄 또는 두 줄 */
  tip: string[];
  track: { filled: number; label: string; steps: TrackStep[] };
};

// 성장 막대의 다섯 단계(새싹부터 열매까지)는 같은 간격으로 놓는다(spec 3.5)
const TRACK = STAGES.slice(1);
/** 막대가 채워진 비율(0~1). 단계 사이는 날짜로 나눠 잇는다. 예: 19일은 꽃과 열매 사이의 4/5 */
export function trackFilled(days: number): number {
  const last = TRACK.length - 1;
  let idx = -1;
  TRACK.forEach((s, i) => { if (days >= s.from) idx = i; });
  if (idx >= last) return 1;
  if (idx < 0) return 0;
  return (idx + (days - TRACK[idx].from) / (TRACK[idx + 1].from - TRACK[idx].from)) / last;
}

export function treeView(me: Member, st: Stats, hasToday: boolean, today: string): TreeView {
  const over = today > SEASON.end;
  const days = st.days;
  const g = growth(days);
  const harvested = !!me.harvestedAt;
  const canHarvest = g.canHarvest && !harvested;
  const left = over ? 0 : workdaysLeft(today, hasToday);

  let headline: string;
  if (harvested) headline = TREE.headline.harvested(me.seed);
  else if (canHarvest) headline = TREE.headline.canHarvest;
  else if (days === 0) headline = TREE.headline.seed;
  else headline = TREE.headline.toGo(FRUIT_DAYS - days);

  let lead: TreeView['lead'];
  if (harvested) lead = { kind: 'harvested' };
  else if (canHarvest) lead = { kind: 'canHarvest' };
  else {
    const next = over || !g.next ? TREE.next.over : TREE.next[g.next.key as keyof typeof TREE.next];
    const nextText = typeof next === 'function' ? next(g.next ? g.next.from - days : 0) : next;
    lead = { kind: 'progress', now: TREE.nowLine[g.cur.key], next: TREE.nextLine(days, nextText) };
  }

  const n = Math.min(days, FRUIT_DAYS);
  return {
    seed: me.seed,
    seedLabel: seedLabel(me.seed),
    days,
    fruits: fruitCount(days),
    harvested,
    canHarvest,
    headline,
    figureLabel: TREE.figureLabel(me.seed, days, harvested ? TREE.harvestedTag : TREE.stage(g.cur.label)),
    harvestLabel: TREE.harvestButton(me.seed),
    lead,
    short: !harvested && !canHarvest && !over && days + left < FRUIT_DAYS ? TREE.short(FRUIT_DAYS - days - left) : null,
    count: g.canHarvest ? TREE.fruitLine(days, fruitCount(days)) : null,
    tip: [TREE.seedTip(me.seed), TREE.fruitTip],
    track: {
      filled: trackFilled(days),
      label: TREE.trackLabel(n),
      steps: TRACK.map((s, i) => ({ label: s.label, from: s.from, at: i / (TRACK.length - 1), reached: days >= s.from, daysText: TREE.trackDays(s.from) })),
    },
  };
}

export type BadgeKey = 'first' | 'week' | 'streak' | 'ten' | 'harvest';
export type BadgeView = { key: BadgeKey; label: string; earned: boolean };

/** 홈의 배지 다섯 개. 기록에서 바로 계산한다(따로 저장하지 않는다) */
export function badgesView(me: Profile, st: Stats, today: string): BadgeView[] {
  const started = today >= SEASON.start;
  return [
    { key: 'first', label: BADGES.first, earned: st.days >= 1 },
    { key: 'week', label: BADGES.week, earned: started && !!st.cur?.done },
    { key: 'streak', label: st.streak >= 1 ? BADGES.streak(st.streak) : BADGES.streakNone, earned: st.streak >= 1 },
    { key: 'ten', label: BADGES.ten, earned: st.days >= 10 },
    { key: 'harvest', label: BADGES.harvest, earned: !!me.harvestedAt },
  ];
}

export type CampView = { text: string; chips: { id: string; name: string; inCamp: boolean }[] };

export function campView(today: string, todays: Attendance[], profiles: Profile[]): CampView {
  if (today > SEASON.end) return { text: CAMP.over, chips: [] };
  if (!isWorkday(today)) return { text: CAMP.rest, chips: [] };
  const name = new Map(profiles.map(p => [p.id, p.name]));
  const list = [...todays].sort((a, b) => (a.checkInAt ?? '').localeCompare(b.checkInAt ?? ''));
  if (list.length === 0) return { text: CAMP.empty, chips: [] };
  return {
    text: CAMP.summary(list.length),
    chips: list.map(r => ({ id: r.userId, name: name.get(r.userId) ?? '', inCamp: !r.checkOutAt })),
  };
}

/* ================= 출근 토스트 (8.3) ================= */

export function checkInMessage(before: Stats, after: Stats): string {
  const gb = growth(before.days).cur.key;
  const ga = growth(after.days).cur.key;
  if (after.days === FRUIT_DAYS && before.days < FRUIT_DAYS) return ACTION.checkIn.fruit;
  if (ga !== gb && ga in ACTION.checkIn.stage) return ACTION.checkIn.stage[ga as keyof typeof ACTION.checkIn.stage];
  if (after.cur?.done && !before.cur?.done) return ACTION.checkIn.weekDone;
  if (after.days > FRUIT_DAYS) return ACTION.checkIn.plain;
  return ACTION.checkIn.grew;
}

/* ================= 캘린더 (3.6) ================= */

export const CALENDAR_MONTHS = ['2026-11', '2026-12'] as const;
export const initialMonth = (today: string) =>
  (CALENDAR_MONTHS as readonly string[]).includes(today.slice(0, 7)) ? today.slice(0, 7) : CALENDAR_MONTHS[CALENDAR_MONTHS.length - 1];

export type CalendarCell =
  | { blank: true; key: string }
  | { blank: false; key: string; day: number; off: boolean; today: boolean; note: string | null; attended: boolean; time: string | null };
export type RecordRow = { date: string; dateText: string; inText: string; outText: string; stayText: string };
export type MonthView = { ym: string; title: string; weekdays: readonly string[]; cells: CalendarCell[]; rows: RecordRow[] };

export function monthView(ym: string, records: Attendance[], today: string): MonthView {
  const [y, mo] = ym.split('-').map(Number);
  const first = `${ym}-01`;
  const daysIn = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const byDate = new Map(records.map(r => [r.workDate, r]));
  const cells: CalendarCell[] = [];
  for (let i = 0; i < dow(first); i++) cells.push({ blank: true, key: `b${i}` });
  for (let n = 1; n <= daysIn; n++) {
    const d = `${ym}-${String(n).padStart(2, '0')}`;
    const r = byDate.get(d);
    const work = isWorkday(d);
    let note: string | null = HOLIDAYS[d] ?? null;
    if (!r && d === today && work) note = CALENDAR.today;
    cells.push({
      blank: false, key: d, day: n, off: !work, today: d === today, note, attended: !!r,
      time: r?.checkInAt ? CALENDAR.timeRange(hhmmKST(r.checkInAt), r.checkOutAt ? hhmmKST(r.checkOutAt) : null) : null,
    });
  }
  const rows = records.filter(r => r.workDate.startsWith(ym)).sort((a, b) => b.workDate.localeCompare(a.workDate)).map(r => {
    const m = Math.floor(stayDurationMs(r) / 60_000);
    return {
      date: r.workDate,
      dateText: koDate(r.workDate),
      inText: r.checkInAt ? hhmmKST(r.checkInAt) : DASH,
      outText: r.checkOutAt ? hhmmKST(r.checkOutAt) : DASH,
      stayText: m > 0 ? koDuration(m) : DASH,
    };
  });
  return { ym, title: koMonth(ym), weekdays: WEEKDAYS, cells, rows };
}

/* ================= 모두의 과수원 (3.7) ================= */

export type MemberCardView = {
  id: string;
  name: string;
  isMe: boolean;
  seed: SeedKey;
  days: number;
  harvested: boolean;
  planLabel: string;
  todayBadge: { text: string; tone: 'lime' | 'neutral' } | null;
  countText: string;
  streakText: string | null;
  figureLabel: string;
};
/** lead 는 한 문장으로 이은 것, leadLines 는 [오늘 문장, 수확 문장]. 768px 미만에서는 수확 문장을 다음 줄로 내린다(3.7) */
export type GardenView = { lead: string; leadLines: [string, string]; members: MemberCardView[] };

export function gardenView(meId: string, profiles: Profile[], all: Attendance[], today: string): GardenView {
  const byUser = new Map<string, Attendance[]>();
  for (const r of all) byUser.set(r.userId, [...(byUser.get(r.userId) ?? []), r]);
  // 씨앗을 아직 심지 않은 사람은 과수원에 나무가 없다
  const list = profiles.filter(isMember).map(p => {
    const recs = byUser.get(p.id) ?? [];
    return { p, st: statsOf(p, recs, today), r: recs.find(x => x.workDate === today) ?? null };
  });
  list.sort((a, b) => {
    if (a.p.id === meId) return -1;
    if (b.p.id === meId) return 1;
    if (!!a.r !== !!b.r) return a.r ? -1 : 1;
    if (a.r && b.r) return (a.r.checkInAt ?? '').localeCompare(b.r.checkInAt ?? '');
    return a.p.name.localeCompare(b.p.name, 'ko');
  });
  const came = list.filter(x => x.r).length;
  const hv = list.filter(x => x.p.harvestedAt).length;
  const hvText = hv ? GARDEN.harvestedSome(hv) : GARDEN.harvestedNone;
  const leadOf = (hvPart: string) => today > SEASON.end ? GARDEN.over(hvPart) : !isWorkday(today) ? GARDEN.rest(hvPart) : GARDEN.workday(list.length, came, hvPart);
  const lead = leadOf(hvText);
  return {
    lead,
    leadLines: [leadOf('').trim(), hvText],
    members: list.map(({ p, st, r }) => ({
      id: p.id,
      name: p.name,
      isMe: p.id === meId,
      seed: p.seed,
      days: st.days,
      harvested: !!p.harvestedAt,
      planLabel: planLabel(p.plan),
      todayBadge: r ? (r.checkOutAt ? { text: GARDEN.left, tone: 'neutral' } : { text: GARDEN.inCamp, tone: 'lime' }) : null,
      countText: p.harvestedAt ? GARDEN.countHarvested(st.days) : GARDEN.count(st.days, growth(st.days).cur.label),
      streakText: st.streak > 0 ? GARDEN.streak(st.streak) : null,
      figureLabel: GARDEN.figureLabel(p.name, p.seed, st.days),
    })),
  };
}

/* ================= 수확 카드 (4.7) ================= */

export type CardModel = {
  seed: SeedKey;
  heading: string;
  sub: string;
  cells: [string, string][];
  /** 시즌 출근일 가운데 나온 날. 막대 하나로 보여 준다(spec 3.9) */
  record: { label: string; percentText: string; ratio: number };
  alt: string;
  fileName: string;
};

export function cardModel(me: Member, records: Attendance[], today: string): CardModel | null {
  if (!me.harvestedAt) return null;
  const st = statsOf(me, records, today);
  const hvDate = todayKST(new Date(me.harvestedAt));
  const plan: PlanKey = me.plan;
  return {
    seed: me.seed,
    heading: CARD.heading(me.name, me.seed),
    sub: CARD.sub(st.days),
    cells: [
      [CARD.cells.days, CARD.daysValue(st.days)],
      [CARD.cells.plan, planLabel(plan)],
      [CARD.cells.first, st.dates[0] ? koDay(st.dates[0]) : DASH],
      [CARD.cells.harvested, koDay(hvDate)],
    ],
    record: {
      label: CARD.record(ALL_WORKDAYS.length, st.days),
      percentText: CARD.percent(Math.round(Math.min(1, st.days / ALL_WORKDAYS.length) * 100)),
      ratio: Math.min(1, st.days / ALL_WORKDAYS.length),
    },
    alt: CARD.alt(me.name, me.seed, st.days, plan, hvDate),
    fileName: CARD.fileName(hvDate),
  };
}

