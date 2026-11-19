'use client';

import { Box, ContentBadge, FlexBox, Typography } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import type { ReactNode } from 'react';

import { TODAY } from '@/lib/copy';
import type { TodayView } from '@/lib/view';

import Panel from './Panel';

// spec 3.5 오늘 패널
const META_TOP = 4;
const META_GAP = 8;
const BUTTON_TOP = 20;
const HINT_TOP = 10;
const TIMES_TOP = 20;

export function StatusBadge({ text, tone, size = 'small' }: { text: string; tone: 'neutral' | 'lime'; size?: 'small' | 'medium' }) {
  return tone === 'lime'
    ? <ContentBadge size={size} color="accent" accentColor="semantic.foreground.accent.lime">{text}</ContentBadge>
    : <ContentBadge size={size} color="neutral" variant="solid">{text}</ContentBadge>;
}

function Time({ label, value }: { label: string; value: string | null }) {
  return (
    <FlexBox as="div" flexDirection="column" gap={4}>
      <Typography as="dt" variant="label2" color="semantic.foreground.neutral.tertiary">{label}</Typography>
      <Typography as="dd" variant="heading2" weight="bold" sx={{ margin: 0, fontVariantNumeric: 'tabular-nums' }}
        color={value ? 'semantic.foreground.neutral.primary' : 'semantic.foreground.neutral.quaternary'}>
        {value ?? TODAY.noTime}
      </Typography>
    </FlexBox>
  );
}

export default function TodayPanel({ view, button }: { view: TodayView; button: ReactNode }) {
  return (
    <Panel aria-labelledby="h-today">
      <Typography as="h1" id="h-today" variant="heading2" weight="bold" color="semantic.foreground.neutral.primary">
        {TODAY.greeting(view.greetingName)}
      </Typography>
      <FlexBox alignItems="center" gap={META_GAP} sx={{ marginTop: META_TOP }}>
        <Typography variant="label1" color="semantic.foreground.neutral.tertiary">{view.dateText}</Typography>
        <StatusBadge text={view.badge.text} tone={view.badge.tone} />
      </FlexBox>
      {/* 주 버튼은 모바일에서도 이 패널 안에 둔다 (spec 3.5, 3.10) */}
      <Box sx={{ marginTop: BUTTON_TOP }}>{button}</Box>
      <Typography as="p" variant="label2" color="semantic.foreground.neutral.tertiary"
        sx={{ marginTop: HINT_TOP }}>
        {view.hint}
      </Typography>
      <Box
        as="dl"
        sx={(theme: Theme) => ({
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, margin: `${TIMES_TOP}px 0 0`, paddingTop: TIMES_TOP,
          borderTop: `1px solid ${theme.semantic.line.neutral.tertiary}`,
        })}
      >
        <Time label={TODAY.checkInTime} value={view.checkIn} />
        <Time label={TODAY.checkOutTime} value={view.checkOut} />
      </Box>
    </Panel>
  );
}
