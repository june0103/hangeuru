import { describe, expect, it } from 'vitest';

import {
  ALL_WORKDAYS, FRUIT_DAYS, SEASON, SEASON_WEEKS, computeStats, growth, workdaysLeft, workdaysOfWeek,
} from './rules';

// 2.6 "예시 기록": 예시 계정의 출근 19일
const SAMPLE = [
  '2026-11-18', '2026-11-19', '2026-11-20',
  '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26', '2026-11-27',
  '2026-11-30', '2026-12-01', '2026-12-02', '2026-12-04',
  '2026-12-07', '2026-12-08', '2026-12-10', '2026-12-11',
  '2026-12-14', '2026-12-15', '2026-12-16',
];

const stageOf = (days: number) => growth(days).cur.key;

describe('시즌과 출근일 (2.1)', () => {
  it('기록할 수 있는 출근일은 27일이다', () => {
    expect(ALL_WORKDAYS).toHaveLength(27);
    expect(ALL_WORKDAYS[0]).toBe('2026-11-18');
    expect(ALL_WORKDAYS.at(-1)).toBe('2026-12-24');
    expect(ALL_WORKDAYS).not.toContain('2026-12-25');
  });

  it('사전 기간은 3일, 정식 기간은 주별로 5, 5, 5, 5, 4일이다', () => {
    expect(ALL_WORKDAYS.filter(d => d < SEASON.start)).toEqual(['2026-11-18', '2026-11-19', '2026-11-20']);
    expect(SEASON_WEEKS).toEqual(['2026-11-23', '2026-11-30', '2026-12-07', '2026-12-14', '2026-12-21']);
    expect(SEASON_WEEKS.map(w => workdaysOfWeek(w, SEASON.start).length)).toEqual([5, 5, 5, 5, 4]);
  });
});

describe('growth (2.3, 2.6 단계 경계)', () => {
  it.each([
    [0, 'seed'], [1, 'sprout'], [4, 'sprout'], [5, 'sapling'], [9, 'sapling'],
    [10, 'tree'], [14, 'tree'], [15, 'flower'], [19, 'flower'], [20, 'fruit'], [27, 'fruit'],
  ])('%i일은 %s 단계다', (days, key) => {
    expect(stageOf(days)).toBe(key);
  });

  it('20일부터 수확할 수 있다', () => {
    expect(growth(FRUIT_DAYS - 1).canHarvest).toBe(false);
    expect(growth(FRUIT_DAYS).canHarvest).toBe(true);
    expect(growth(FRUIT_DAYS).next).toBeNull();
  });
});

describe('검산용 예시 (2.6)', () => {
  it('steady, 11-18 가입, 예시 기록 19일, 오늘 12-17', () => {
    const today = '2026-12-17';
    const st = computeStats('steady', '2026-11-18', SAMPLE, today);
    expect(st.days).toBe(19);
    expect(stageOf(st.days)).toBe('flower');
    expect(st.cur).toMatchObject({ w: '2026-12-14', count: 3, goal: 3, done: true });
    expect(st.streak).toBe(4);
    expect(workdaysLeft(today, st.dates.includes(today))).toBe(6);
  });

  it('위 상태에서 12-17 출근', () => {
    const today = '2026-12-17';
    const st = computeStats('steady', '2026-11-18', [...SAMPLE, today], today);
    expect(st.days).toBe(20);
    expect(stageOf(st.days)).toBe('fruit');
    expect(growth(st.days).canHarvest).toBe(true);
    expect(st.cur).toMatchObject({ count: 4, goal: 3, done: true });
    expect(st.streak).toBe(4);
  });

  it('steady, 11-18 가입, 출근 11-18·19, 오늘 11-20', () => {
    const st = computeStats('steady', '2026-11-18', ['2026-11-18', '2026-11-19'], '2026-11-20');
    expect(st.days).toBe(2);
    expect(stageOf(st.days)).toBe('sprout');
    expect(st.cur).toBeNull();
    expect(st.streak).toBe(0);
  });

  it('light, 12-17 가입, 출근 없음, 오늘 12-17', () => {
    const today = '2026-12-17';
    const st = computeStats('light', today, [], today);
    expect(st.days).toBe(0);
    expect(stageOf(st.days)).toBe('seed');
    expect(st.cur).toMatchObject({ w: '2026-12-14', count: 0, goal: 1 });
    const left = workdaysLeft(today, false);
    expect(left).toBe(6);
    expect(FRUIT_DAYS - (st.days + left)).toBe(14); // 열매까지 14일 모자람
  });
});

describe('workdaysLeft (2.4)', () => {
  it('12-17에 출근 전이면 6, 출근 후면 5', () => {
    expect(workdaysLeft('2026-12-17', false)).toBe(6);
    expect(workdaysLeft('2026-12-17', true)).toBe(5);
  });
});

describe('위치 확인 (2.8)', () => {
  it('그라운드 위치는 반경 안이다', async () => {
    const { CAMP, campCheck } = await import('./rules');
    expect(campCheck(CAMP)).toEqual({ distance: 0, inside: true });
  });
  it('위도 0.004도(약 445m) 북쪽은 안, 0.005도(약 556m)는 밖이다', async () => {
    const { CAMP, campCheck } = await import('./rules');
    const a = campCheck({ lat: CAMP.lat + 0.004, lng: CAMP.lng });
    const b = campCheck({ lat: CAMP.lat + 0.005, lng: CAMP.lng });
    expect(a.inside).toBe(true);
    expect(Math.round(a.distance)).toBe(445);
    expect(b.inside).toBe(false);
    expect(Math.round(b.distance)).toBe(556);
  });
  it('서울역은 12km 넘게 떨어져 반경 밖이다', async () => {
    const { campCheck } = await import('./rules');
    const c = campCheck({ lat: 37.5547, lng: 126.9707 });
    expect(c.inside).toBe(false);
    expect(c.distance).toBeGreaterThan(12000);
  });
});

describe('열매 수 (2.3)', () => {
  it('20일 전에는 0, 20일에 다섯 개, 그 뒤로 하루에 하나씩', async () => {
    const { fruitCount } = await import('./rules');
    expect([0, 19, 20, 21, 27].map(fruitCount)).toEqual([0, 0, 5, 6, 12]);
  });
});
