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

export default function GrowthTrack({ track }: { track: TreeView['track'] }) {
  return (
    <Box role="img" aria-label={track.label} sx={{ width: '100%', padding: `0 ${SIDE}px`, boxSizing: 'border-box' }}>
      <Box sx={(theme: Theme) => ({ position: 'relative', height: BAR, borderRadius: 9999, backgroundColor: theme.semantic.surface.neutral.strong })}>
        <Box sx={(theme: Theme) => ({
          position: 'absolute', left: 0, top: 0, bottom: 0, width: `${track.filled * 100}%`,
          borderRadius: 9999, backgroundColor: theme.semantic.foreground.positive.primary,
        })} />
        {track.steps.map(s => (
          <Box key={s.from} sx={(theme: Theme) => ({
            position: 'absolute', top: '50%', left: `${s.at * 100}%`, width: DOT, height: DOT, margin: `-${DOT / 2}px 0 0 -${DOT / 2}px`,
            borderRadius: 9999,
            ...(s.reached
              ? { backgroundColor: theme.atomic.green[40], "html[data-theme='dark'] &": { backgroundColor: theme.atomic.green[50] } }
              : { backgroundColor: theme.semantic.background.neutral.primary, boxShadow: `inset 0 0 0 2px ${theme.semantic.line.neutral.primary}` }),
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
