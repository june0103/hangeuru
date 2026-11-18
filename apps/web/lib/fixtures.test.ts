import { describe, expect, it } from 'vitest';

import { createFixtures } from './fixtures';
import { computeStats } from './rules';

// spec 13.2: 플랜이 섞인 구성원 6명 이상, 2.6의 첫 예시, 수확을 마친 구성원 1명 이상
describe('fixtures', () => {
  const { profiles, attendance } = createFixtures();
  const today = '2026-12-17';
  const statsOf = (id: string) => {
    const p = profiles.find(x => x.id === id)!;
    return computeStats(p.plan, p.joinDate, attendance.filter(r => r.userId === id).map(r => r.workDate), today);
  };

  it('구성원 6명 이상, 플랜 셋이 모두 있다', () => {
    expect(profiles.length).toBeGreaterThanOrEqual(6);
    expect(new Set(profiles.map(p => p.plan))).toEqual(new Set(['light', 'steady', 'daily']));
  });

  it('예시 계정은 spec 2.6의 첫 예시와 같다', () => {
    const st = statsOf('demo');
    expect(st.days).toBe(19);
    expect(st.streak).toBe(4);
  });

  it('12-17까지 수확을 마친 구성원이 있다', () => {
    const hv = profiles.filter(p => p.harvestedAt && p.harvestedAt.slice(0, 10) <= today);
    expect(hv.length).toBeGreaterThanOrEqual(1);
    for (const p of hv) expect(statsOf(p.id).days).toBeGreaterThanOrEqual(20);
  });

  it('하루 1건, 퇴근은 출근 뒤다', () => {
    const keys = attendance.map(r => `${r.userId}|${r.workDate}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const r of attendance) if (r.checkOutAt) expect(r.checkOutAt > r.checkInAt!).toBe(true);
  });
});
