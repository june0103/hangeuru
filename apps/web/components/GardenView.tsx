'use client';

import { Box, ContentBadge, FlexBox, Typography } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { IconFireFill } from '@montage-ui/icon';

import { GARDEN } from '@/lib/copy';
import type { GardenView as View } from '@/lib/view';

import Panel from './Panel';
import { StatusBadge } from './TodayPanel';
import TreeFigure from './TreeFigure';

// spec 3.7 모두의 과수원
const LEAD_TOP = 8;
const LIST_TOP = 24;
const GAP = 16;
const CARD_PAD = 20;
const INFO_GAP = 8;
const FIRE = 14;

export default function GardenView({ view }: { view: View }) {
  return (
    <>
      <Typography as="h1" variant="title3" weight="bold" color="semantic.foreground.neutral.primary">{GARDEN.title}</Typography>
      <Typography as="p" variant="body1-reading" color="semantic.foreground.neutral.secondary" sx={{ marginTop: LEAD_TOP, maxWidth: '38em' }}>{view.lead}</Typography>
      <Box
        as="ul"
        sx={{
          display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: GAP, margin: `${LIST_TOP}px 0 0`, padding: 0, listStyle: 'none',
          '@media (max-width: 991px)': { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
          '@media (max-width: 599px)': { gridTemplateColumns: '1fr' },
        }}
      >
        {view.members.map(m => (
          <Panel key={m.id} as="li" sx={{ display: 'flex', gap: GAP, alignItems: 'flex-start', padding: CARD_PAD, '@media (max-width: 767px)': { padding: CARD_PAD } }}>
            <FlexBox flexDirection="column" gap={INFO_GAP} sx={{ flex: 1, minWidth: 0 }}>
              <FlexBox alignItems="center" gap={6} flexWrap="wrap">
                <Typography variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{m.name}</Typography>
                {m.isMe && <ContentBadge size="small" color="accent" accentColor="semantic.foreground.brand.primary">{GARDEN.me}</ContentBadge>}
              </FlexBox>
              <FlexBox flexWrap="wrap" gap={4}>
                <ContentBadge size="small" color="neutral" variant="solid">{m.planLabel}</ContentBadge>
                {m.harvested && <ContentBadge size="small" color="accent" accentColor="semantic.foreground.accent.violet">{GARDEN.harvested}</ContentBadge>}
                {m.todayBadge && <StatusBadge text={m.todayBadge.text} tone={m.todayBadge.tone} />}
              </FlexBox>
              <Typography as="p" variant="label1" color="semantic.foreground.neutral.secondary">{m.countText}</Typography>
              {m.streakText && (
                <FlexBox as="p" alignItems="center" gap={4}>
                  <Box as="span" aria-hidden sx={(theme: Theme) => ({ display: 'inline-flex', color: theme.semantic.foreground.cautionary.primary })}>
                    <IconFireFill width={FIRE} height={FIRE} />
                  </Box>
                  <Typography variant="label2" color="semantic.foreground.neutral.tertiary">{m.streakText}</Typography>
                </FlexBox>
              )}
            </FlexBox>
            <Box sx={{ flexShrink: 0 }}>
              <TreeFigure seed={m.seed} days={m.days} harvested={m.harvested} label={m.figureLabel} mini />
            </Box>
          </Panel>
        ))}
      </Box>
    </>
  );
}
