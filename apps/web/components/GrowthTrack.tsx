'use client';

import { Box, Typography } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';

import type { TreeView } from '@/lib/view';

// 성장 트랙 (spec 3.5)
const SIDE = 14;
const BAR = 8;
const DOT = 12;
const LABEL_TOP = 8;
const LABEL_H = 38;

/** hue: 채워진 부분의 색, deep: 지나온 점의 색. 레벨 표시와 같은 색을 쓴다 */
export default function GrowthTrack({ track, hue, deep }: { track: TreeView['track']; hue: string; deep: string }) {
  return (
    <Box role="img" aria-label={track.label} sx={{ width: '100%', padding: `0 ${SIDE}px`, boxSizing: 'border-box' }}>
      <Box sx={(theme: Theme) => ({ position: 'relative', height: BAR, borderRadius: 9999, backgroundColor: theme.semantic.surface.neutral.strong })}>
        <Box style={{ width: `${track.filled * 100}%`, backgroundColor: hue }} sx={{ position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 9999 }} />
        {track.steps.map(s => (
          <Box key={s.from} style={s.reached ? { backgroundColor: deep } : undefined} sx={(theme: Theme) => ({
            position: 'absolute', top: '50%', left: `${s.at * 100}%`, width: DOT, height: DOT, margin: `-${DOT / 2}px 0 0 -${DOT / 2}px`,
            borderRadius: 9999,
            ...(s.reached ? {} : { backgroundColor: theme.semantic.background.neutral.primary, boxShadow: `inset 0 0 0 2px ${theme.semantic.line.neutral.primary}` }),
          })} />
        ))}
      </Box>
      <Box aria-hidden sx={{ position: 'relative', height: LABEL_H, marginTop: LABEL_TOP }}>
        {track.steps.map(s => (
          <Box key={s.from} sx={{ position: 'absolute', top: 0, left: `${s.at * 100}%`, transform: 'translateX(-50%)', display: 'flex', flexDirection: 'column', alignItems: 'center', whiteSpace: 'nowrap' }}>
            <Typography variant="caption1" weight={s.reached ? 'bold' : 'medium'}
              color={s.reached ? 'semantic.foreground.neutral.primary' : 'semantic.foreground.neutral.tertiary'}>{s.label}</Typography>
            <Typography variant="caption2" color="semantic.foreground.neutral.quaternary" sx={{ fontVariantNumeric: 'tabular-nums' }}>{s.daysText}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}
