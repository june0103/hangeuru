'use client';

import { Box, ContentBadge, FlexBox, Typography } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { IconCheckThick, IconFireFill } from '@montage-ui/icon';

import { DASH, WEEK } from '@/lib/copy';
import type { WeekDot, WeekView } from '@/lib/view';

import Panel from './Panel';

// spec 3.5 이번 주 패널
const DOTS_TOP = 16;
const DOT = 36;
const DOT_GAP = 6;
const TEXT_TOP = 16;
const STREAK_GAP = 12;
const FIRE = 18;

function Dot({ d }: { d: WeekDot }) {
  const isToday = d.state === 'today';
  return (
    <FlexBox as="li" flexDirection="column" alignItems="center" gap={DOT_GAP} aria-label={d.label}>
      <Typography aria-hidden variant="caption1" weight={isToday ? 'bold' : 'medium'}
        color={isToday ? 'semantic.foreground.neutral.primary' : 'semantic.foreground.neutral.tertiary'}>
        {d.weekday}
      </Typography>
      <FlexBox
        aria-hidden
        alignItems="center"
        justifyContent="center"
        sx={(theme: Theme) => ({
          width: DOT, height: DOT, borderRadius: '50%',
          ...(d.state === 'done' && { backgroundColor: theme.semantic.surface.accent.violetOpaque, color: theme.semantic.static.white }),
          ...(d.state === 'today' && { backgroundColor: theme.semantic.surface.accent.violet, boxShadow: `inset 0 0 0 2px ${theme.semantic.line.accent.violet}` }),
          ...(d.state === 'empty' && { backgroundColor: theme.semantic.surface.neutral.tertiary, boxShadow: `inset 0 0 0 1.5px ${theme.semantic.line.neutral.primary}` }),
          ...(d.state === 'rest' && { color: theme.semantic.foreground.neutral.quaternary }),
        })}
      >
        {d.state === 'done' && <IconCheckThick width={18} height={18} />}
        {d.state === 'today' && <Typography variant="caption1" weight="bold" color="semantic.foreground.accent.violet">{WEEK.today}</Typography>}
        {d.state === 'rest' && <Typography variant="caption1" weight="bold">{DASH}</Typography>}
      </FlexBox>
      <Typography aria-hidden variant="caption1" weight={isToday ? 'bold' : 'regular'} sx={{ fontVariantNumeric: 'tabular-nums' }}
        color={isToday ? 'semantic.foreground.neutral.primary' : 'semantic.foreground.neutral.quaternary'}>
        {d.dayNum}
      </Typography>
    </FlexBox>
  );
}

export default function WeekPanel({ view }: { view: WeekView }) {
  return (
    <Panel aria-labelledby="h-week">
      <FlexBox alignItems="center" justifyContent="space-between" gap={12}>
        <FlexBox alignItems="center" gap={8}>
          <Typography as="h2" id="h-week" variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{view.title}</Typography>
          <ContentBadge size="small" color="neutral" variant="solid">{view.planLabel}</ContentBadge>
        </FlexBox>
        {view.done && <ContentBadge size="small" color="accent" accentColor="semantic.foreground.accent.violet">{WEEK.done}</ContentBadge>}
      </FlexBox>
      <Box as="ol" sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, margin: `${DOTS_TOP}px 0 0`, padding: 0, listStyle: 'none' }}>
        {view.dots.map(d => <Dot key={d.date} d={d} />)}
      </Box>
      <Typography as="p" variant="label1-reading" color="semantic.foreground.neutral.secondary" sx={{ marginTop: TEXT_TOP }}>
        {view.text}
      </Typography>
      {view.streakText && (
        <FlexBox
          as="p"
          alignItems="center"
          gap={6}
          sx={(theme: Theme) => ({ marginTop: STREAK_GAP, paddingTop: STREAK_GAP, borderTop: `1px solid ${theme.semantic.line.neutral.tertiary}` })}
        >
          <Box as="span" aria-hidden sx={(theme: Theme) => ({ display: 'inline-flex', color: theme.semantic.foreground.cautionary.primary })}>
            <IconFireFill width={FIRE} height={FIRE} />
          </Box>
          <Typography variant="label1" weight="bold" color="semantic.foreground.neutral.primary">{view.streakText}</Typography>
        </FlexBox>
      )}
    </Panel>
  );
}
