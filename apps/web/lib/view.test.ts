import { describe, expect, it } from 'vitest';

import { TODAY, WEEK } from './copy';
import type { Attendance, Profile } from './types';
import { campView, monthView, statsOf, todayView, weekView } from './view';

const me: Profile = { id: 'me', name: '고준', plan: 'steady', seed: 'apple', joinDate: '2026-11-18', harvestedAt: null };
const rec = (d: string, inT = '09:48', outT: string | null = null): Attendance => ({
  userId: 'me', workDate: d, checkInAt: new Date(`${d}T${inT}:00+09:00`).toISOString(),
  checkOutAt: outT ? new Date(`${d}T${outT}:00+09:00`).toISOString() : null,
});

describe('오늘 패널 상태 (3.5)', () => {
  it('토요일은 쉬는 날이고 다음 출근일을 안내한다', () => {
    const v = todayView(me, null, '2026-12-19');
    expect(v.badge.text).toBe(TODAY.states.rest.badge);
    expect(v.button.action).toBeNull();
    expect(v.hint).toBe('주말과 공휴일에는 출근을 기록하지 않아요. 다음 출근일은 12월 21일 월요일이에요.');
  });
  it('12-25는 쉬는 날이고 남은 출근일이 없으면 둘째 문장을 뺀다', () => {
    expect(todayView(me, null, '2026-12-25').hint).toBe(TODAY.states.rest.hint);
  });
  it('12-25 뒤는 시즌 종료', () => {
    const v = todayView(me, null, '2026-12-26');
    expect(v.badge.text).toBe('시즌 종료');
    expect(v.button.label).toBe('시즌이 끝났어요');
  });
  it('11-17은 쉬는 날로 보인다', () => {
    expect(todayView(me, null, '2026-11-17').badge.text).toBe('쉬는 날');
  });
  it('출근 전 → 그라운드에 있음 → 퇴근함', () => {
    expect(todayView(me, null, '2026-12-17').button).toMatchObject({ label: '출근하기', action: 'checkIn' });
    expect(todayView(me, rec('2026-12-17'), '2026-12-17')).toMatchObject({ checkIn: '09:48', checkOut: null, badge: { tone: 'lime' } });
    expect(todayView(me, rec('2026-12-17', '09:48', '18:32'), '2026-12-17').button).toMatchObject({ label: '퇴근 시간 다시 기록', variant: 'outlined' });
  });
});

describe('이번 주 패널 (3.5)', () => {
  it('정식 시작 전에는 18~20일만 쓸 수 있고 시작일을 안내한다', () => {
    const recs = [rec('2026-11-18')];
    const v = weekView(me, statsOf(me, recs, '2026-11-19'), '2026-11-19')!;
    expect(v.dots.map(d => d.state)).toEqual(['rest', 'rest', 'done', 'today', 'empty']);
    expect(v.text).toBe(WEEK.text.pre);
    expect(v.done).toBe(false);
    expect(v.streakText).toBeNull();
  });
  it('시즌 종료 뒤에는 마지막 주', () => {
    const v = weekView(me, statsOf(me, [], '2026-12-26'), '2026-12-26')!;
    expect(v.title).toBe('마지막 주');
    expect(v.text).toBe('마지막 주에는 0일 출근했어요.');
    expect(v.dots.at(-1)!.state).toBe('rest'); // 12-25
  });
});

describe('오늘 그라운드 (3.5)', () => {
  it('출근 시각이 빠른 순, 퇴근 전만 점', () => {
    const people = [{ ...me, id: 'a', name: '가' }, { ...me, id: 'b', name: '나' }];
    const v = campView('2026-12-17', [
      { ...rec('2026-12-17', '10:00'), userId: 'a' },
      { ...rec('2026-12-17', '09:00', '18:00'), userId: 'b' },
    ], people);
    expect(v.text).toBe('오늘 2명이 출근했고, 지금 1명이 그라운드에 있어요.');
    expect(v.chips).toEqual([{ id: 'b', name: '나', inCamp: false }, { id: 'a', name: '가', inCamp: true }]);
  });
});

describe('캘린더 (3.6)', () => {
  it('머문 시간과 퇴근 없는 기록', () => {
    const m = monthView('2026-12', [rec('2026-12-01', '09:43', '18:50'), rec('2026-12-02', '09:49'), rec('2026-12-03', '09:00', '09:42')], '2026-12-17');
    expect(m.title).toBe('2026년 12월');
    expect(m.rows.map(r => [r.dateText, r.stayText])).toEqual([
      ['12월 3일 목요일', '42분'], ['12월 2일 수요일', '–'], ['12월 1일 화요일', '9시간 7분'],
    ]);
    const c = m.cells.find(x => !x.blank && x.key === '2026-12-02');
    expect(c && !c.blank && c.time).toBe('09:49 ~');
    const xmas = m.cells.find(x => !x.blank && x.key === '2026-12-25');
    expect(xmas && !xmas.blank && [xmas.off, xmas.note]).toEqual([true, '성탄절']);
  });
});

describe('위치 안내 문구 (2.8)', () => {
  it('거리를 10m 단위, 1km 이상은 km로 보인다', async () => {
    const { LOCATION } = await import('./copy');
    expect(LOCATION.outside(612.4, 500)).toBe('그라운드에서 610m 떨어져 있어요. 그라운드 500m 안에서 기록할 수 있어요.');
    expect(LOCATION.outside(12840, 500)).toBe('그라운드에서 12.8km 떨어져 있어요. 그라운드 500m 안에서 기록할 수 있어요.');
  });
});
