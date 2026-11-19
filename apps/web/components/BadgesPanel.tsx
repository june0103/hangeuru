'use client';

import { Typography } from '@montage-ui/core';

import { BADGES } from '@/lib/copy';
import type { BadgeKey, BadgeView } from '@/lib/view';

import Panel from './Panel';

// spec 3.5 배지 패널. 기록에서 바로 계산한 배지 다섯 개. 아직 못 모은 것은 자물쇠와 "잠김"으로 가린다
const TEXT_TOP = 8;

// 배지 그림(24 × 24, 선 그림)
const ICON: Record<BadgeKey | 'lock', string> = {
  first: 'M12 20v-8M12 12c0-3 2-5 6-5 0 3-2 5-6 5zM12 14c0-2.5-1.8-4.2-5-4.2 0 2.6 1.8 4.2 5 4.2z',
  week: 'M12 4a8 8 0 1 0 0 16a8 8 0 0 0 0-16zM12 9a3 3 0 1 0 0 6a3 3 0 0 0 0-6z',
  streak: 'M12 3c1 3 4.5 4.8 4.5 9a4.5 4.5 0 0 1-9 0c0-1.6.7-2.7 1.6-3.6.3 1.2 1 1.9 1.7 2.1C10.3 8.2 10.8 5.2 12 3z',
  ten: 'M6 6h12a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM5 10h14M9 4v3M15 4v3M9.5 14.6l1.8 1.8 3.3-3.5',
  harvest: 'M5 11h14l-1.4 7.2a1 1 0 0 1-1 .8H7.4a1 1 0 0 1-1-.8zM8 11l3-6M16 11l-3-6M10 14.5v2M14 14.5v2',
  lock: 'M7 11h10v8H7zM9 11V8a3 3 0 0 1 6 0v3',
};

export default function BadgesPanel({ badges }: { badges: BadgeView[] }) {
  const got = badges.filter(b => b.earned).length;
  const summary = got === badges.length ? BADGES.summaryAll : got === 0 ? BADGES.summaryNone : BADGES.summary(got);
  return (
    <Panel aria-labelledby="h-badges" order={4}>
      <Typography as="h2" id="h-badges" variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{BADGES.title}</Typography>
      <Typography as="p" variant="body2" color="semantic.foreground.neutral.secondary" sx={{ marginTop: TEXT_TOP }}>{typeof summary === 'string' ? summary : <>{summary[0]}<br />{summary[1]}</>}</Typography>
      <ul className="orchard-badges">
        {badges.map((b, i) => (
          <li key={b.key} className={b.earned ? 'on' : 'off'} style={{ '--i': i } as React.CSSProperties}>
            <span className="m" aria-hidden="true">
              <svg viewBox="0 0 24 24"><path d={ICON[b.earned ? b.key : 'lock']} /></svg>
            </span>
            <span className="t">{b.earned ? b.label : BADGES.locked}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
