'use client';

import { Box, Button, ContentBadge, FlexBox, SectionMessage, Typography } from '@montage-ui/core';

import { TREE } from '@/lib/copy';
import type { TreeView } from '@/lib/view';

import GrowthTrack from './GrowthTrack';
import Panel from './Panel';
import TreeFigure from './TreeFigure';

// spec 3.5 내 나무 패널
const HEADLINE_TOP = 8;
const BODY_TOP = 12;
const BODY_GAP = 24;
const FIG = 240;
const FIG_M = 220;
const SIDE_TOP = 28;
const SIDE_GAP = 16;

type Props = {
  view: TreeView;
  animateNewest: boolean;
  harvesting: boolean;
  onHarvest: () => void;
  onOpenCard: () => void;
};

export default function TreePanel({ view, animateNewest, harvesting, onHarvest, onOpenCard }: Props) {
  return (
    <Panel aria-labelledby="h-tree">
      <FlexBox alignItems="center" justifyContent="space-between" gap={12}>
        <Typography as="h2" id="h-tree" variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{TREE.title}</Typography>
        <ContentBadge size="medium" color="neutral" variant="solid">{view.seedLabel}</ContentBadge>
      </FlexBox>
      <Typography as="p" variant="heading1" weight="bold" color="semantic.foreground.neutral.primary" sx={{ marginTop: HEADLINE_TOP }}>
        {view.headline}
      </Typography>
      <FlexBox
        alignItems="flex-start"
        gap={BODY_GAP}
        sx={{ marginTop: BODY_TOP, '@media (max-width: 767px)': { flexDirection: 'column', alignItems: 'center', gap: 8 } }}
      >
        <Box sx={{ flex: `0 0 ${FIG}px`, maxWidth: '100%', '@media (max-width: 767px)': { flexBasis: 'auto', width: FIG_M } }}>
          <TreeFigure
            seed={view.seed}
            days={view.days}
            harvested={view.harvested}
            label={view.figureLabel}
            animateNewest={animateNewest}
            onHarvest={view.canHarvest && !harvesting ? onHarvest : undefined}
            harvestLabel={view.harvestLabel}
          />
        </Box>
        <FlexBox
          flexDirection="column"
          alignItems="flex-start"
          gap={SIDE_GAP}
          sx={{ flex: 1, minWidth: 0, paddingTop: SIDE_TOP, '@media (max-width: 767px)': { paddingTop: 0, width: '100%' } }}
        >
          {view.lead.kind === 'harvested' && (
            <>
              <Typography as="p" variant="body2-reading" color="semantic.foreground.neutral.secondary">{TREE.harvestedText}</Typography>
              <Button variant="outlined" color="assistive" size="medium" onClick={onOpenCard}>{TREE.openCard}</Button>
            </>
          )}
          {view.lead.kind === 'canHarvest' && (
            <SectionMessage variant="positive" description={TREE.canHarvestDesc} sx={{ width: '100%' }}>{TREE.canHarvestTitle}</SectionMessage>
          )}
          {view.lead.kind === 'progress' && (
            <Typography as="p" variant="body2-reading" color="semantic.foreground.neutral.secondary">{view.lead.text}</Typography>
          )}
          {view.short && <Typography as="p" variant="body2-reading" color="semantic.foreground.neutral.tertiary">{view.short}</Typography>}
          <GrowthTrack track={view.track} />
          {view.note && <Typography as="p" variant="body2-reading" color="semantic.foreground.neutral.tertiary">{view.note}</Typography>}
        </FlexBox>
      </FlexBox>
    </Panel>
  );
}
