import { describe, expect, it } from 'vitest';

import { hhmmKST, todayKST } from './time';

describe('todayKST (6.3)', () => {
  it('UTC 15:00 이후에는 다음 날짜를 돌려준다', () => {
    expect(todayKST(new Date('2026-12-02T14:59:59Z'))).toBe('2026-12-02');
    expect(todayKST(new Date('2026-12-02T15:00:00Z'))).toBe('2026-12-03');
  });
});

describe('hhmmKST (6.3)', () => {
  it('KST 24시간제 HH:MM', () => {
    expect(hhmmKST('2026-12-03T00:48:00Z')).toBe('09:48');
    expect(hhmmKST('2026-12-03T09:32:00Z')).toBe('18:32');
    expect(hhmmKST('2026-12-02T15:05:00Z')).toBe('00:05');
  });
});
