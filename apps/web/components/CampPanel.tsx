'use client';

import { Box, ContentBadge, FlexBox, TextButton, Typography } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import Link from 'next/link';

import { CAMP } from '@/lib/copy';
import type { CampView } from '@/lib/view';

import Panel from './Panel';

// spec 3.5 오늘 그라운드 패널
const TEXT_TOP = 8;
const CHIPS_TOP = 12;
const CHIP_GAP = 6;
const DOT = 6;

export default function CampPanel({ view }: { view: CampView }) {
  return (
    <Panel aria-labelledby="h-camp">
      <Typography as="h2" id="h-camp" variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{CAMP.title}</Typography>
      <Typography as="p" variant="body2" color="semantic.foreground.neutral.secondary" sx={{ marginTop: TEXT_TOP }}>{view.text}</Typography>
      {view.chips.length > 0 && (
        <FlexBox as="ul" flexWrap="wrap" gap={CHIP_GAP} sx={{ margin: `${CHIPS_TOP}px 0 0`, padding: 0, listStyle: 'none' }}>
          {view.chips.map(c => (
            <li key={c.id}>
              <ContentBadge
                size="medium"
                color="neutral"
                variant="outlined"
                leadingContent={c.inCamp ? (
                  <Box as="span" aria-hidden sx={(theme: Theme) => ({ display: 'inline-block', width: DOT, height: DOT, borderRadius: '50%', backgroundColor: theme.semantic.foreground.accent.lime })} />
                ) : undefined}
              >
                {c.name}
                {c.inCamp && <Box as="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }}>{CAMP.inCampSr}</Box>}
              </ContentBadge>
            </li>
          ))}
        </FlexBox>
      )}
      <TextButton as={Link} href="/garden" size="small" color="primary" sx={{ marginTop: CHIPS_TOP }}>{CAMP.toGarden}</TextButton>
    </Panel>
  );
}
