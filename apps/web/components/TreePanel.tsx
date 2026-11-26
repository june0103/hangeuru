'use client';

import { Box, ContentBadge, FlexBox, SectionMessage, Typography } from '@montage-ui/core';
import { useEffect, useId, useMemo, useRef, useState } from 'react';

import { clockDuration, TREE } from '@/lib/copy';
import { levelLook } from '@/lib/orchard/extras';
import type { AttendanceTime } from '@/lib/rules';
import type { TreeView } from '@/lib/view';

import GrowthTrack from './GrowthTrack';
import Panel from './Panel';
import TreeFigure from './TreeFigure';
import { useAttendanceTimer } from './useAttendanceTimer';

// spec 3.5 내 씨앗 패널
const HEADLINE_TOP = 8;
const BODY_TOP = 12;
const BODY_GAP = 24;
const FIG = 240;
const FIG_M = 220;
const SIDE_TOP = 28;
const SIDE_GAP = 16;
const TIP_MS = 5000;

/** 씨앗 칩: 누르면 어떤 씨앗을 골랐는지 툴팁처럼 알려 준다 */
function SeedChip({ label, tip }: { label: string; tip: string[] }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLSpanElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => setOpen(false), TIP_MS);
    const away = (e: MouseEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('click', away);
    document.addEventListener('keydown', esc);
    return () => { clearTimeout(timer); document.removeEventListener('click', away); document.removeEventListener('keydown', esc); };
  }, [open]);
  return (
    <span className="orchard-seedtip" ref={wrap}>
      <span
        role="button"
        tabIndex={0}
        aria-expanded={open}
        aria-describedby={id}
        onClick={() => setOpen(v => !v)}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(v => !v); } }}
      >
        <ContentBadge className="orchard-seedbadge" size="medium" color="neutral" variant="solid">{label}</ContentBadge>
      </span>
      <span role="tooltip" id={id} hidden={!open}>
        {tip.map(line => <span key={line}>{line}</span>)}
      </span>
    </span>
  );
}

function AttendanceTimer(attendance: AttendanceTime) {
  const { totalMs } = useAttendanceTimer(attendance);
  return (
    <span className="orchard-attendance-time" role="timer" aria-label={TREE.attendanceTime}>
      {clockDuration(totalMs)}
    </span>
  );
}

type Props = {
  view: TreeView;
  attendanceTime: AttendanceTime;
  harvesting: boolean;
  onHarvest: () => void;
  onOpenCard: () => void;
  /** 출근해서 자라는 장면이 끝난 뒤 */
  onGrown: (days: number) => void;
};

export default function TreePanel({ view, attendanceTime, harvesting, onHarvest, onOpenCard, onGrown }: Props) {
  const look = useMemo(() => levelLook(view.days, view.harvested), [view.days, view.harvested]);
  const [levelSlot, setLevelSlot] = useState<HTMLSpanElement | null>(null);
  return (
    <Panel aria-labelledby="h-tree" order={2}>
      {/* 머리줄: 왼쪽에 제목과 문장, 오른쪽 위에 레벨 표시(제목 줄에 맞춤, spec 3.5) */}
      <FlexBox alignItems="flex-start" justifyContent="space-between" gap={12}>
        <Box sx={{ minWidth: 0 }}>
          <Typography as="h2" id="h-tree" variant="headline2" weight="bold" color="semantic.foreground.neutral.primary">{TREE.title}</Typography>
          <Typography as="p" variant="heading1" weight="bold" color="semantic.foreground.neutral.primary" sx={{ marginTop: HEADLINE_TOP }}>
            {view.headline}
          </Typography>
        </Box>
        <span className="orchard-level-summary">
          <span className="orchard-lv-slot" ref={setLevelSlot} />
          <AttendanceTimer {...attendanceTime} />
        </span>
      </FlexBox>
      <FlexBox
        alignItems="flex-start"
        gap={BODY_GAP}
        sx={{ marginTop: BODY_TOP, '@media (max-width: 767px)': { flexDirection: 'column', alignItems: 'center', gap: 8 } }}
      >
        {/* 나무 그림 줄: 패널 폭. 그림은 가운데, 씨앗 칩은 오른쪽 아래(나무 그림 아랫변과 레벨 표시의 오른쪽 끝에 맞춤, spec 3.5) */}
        <Box className="orchard-figrow" sx={{ position: 'relative', display: 'flex', justifyContent: 'center', flex: `0 0 ${FIG}px`, maxWidth: '100%', '@media (max-width: 767px)': { flexBasis: 'auto', alignSelf: 'stretch' } }}>
        <Box sx={{ width: '100%', '@media (max-width: 767px)': { width: FIG_M } }}>
          <TreeFigure
            seed={view.seed}
            days={view.days}
            fruits={view.fruits}
            harvested={view.harvested}
            label={view.figureLabel}
            onHarvest={view.canHarvest && !harvesting ? onHarvest : undefined}
            harvestLabel={view.harvestLabel}
            onGrown={onGrown}
            levelSlot={levelSlot}
            onLevel={view.harvested ? onOpenCard : undefined}
            levelActionLabel={TREE.openCard}
          />
        </Box>
          <span className="orchard-chipfig"><SeedChip label={view.seedLabel} tip={view.tip} /></span>
        </Box>
        <FlexBox
          flexDirection="column"
          alignItems="flex-start"
          gap={SIDE_GAP}
          sx={{ flex: 1, minWidth: 0, paddingTop: SIDE_TOP, '@media (max-width: 767px)': { paddingTop: 0, width: '100%' } }}
        >
          {view.lead.kind === 'harvested' && (
            <Typography as="p" variant="body2-reading" color="semantic.foreground.neutral.secondary">{TREE.harvestedText}</Typography>
          )}
          {view.lead.kind === 'canHarvest' && (
            <SectionMessage variant="positive" description={TREE.canHarvestDesc} sx={{ width: '100%' }}>{TREE.canHarvestTitle}</SectionMessage>
          )}
          {view.lead.kind === 'progress' && (
            <p data-orchard-lead="">
              <span className="orchard-now">{view.lead.now}</span>
              <span className="orchard-next">{view.lead.next}</span>
            </p>
          )}
          {view.count && <p data-orchard-lead=""><span className="orchard-next">{view.count}</span></p>}
          {view.short && <Typography as="p" variant="body2-reading" color="semantic.foreground.neutral.tertiary">{view.short}</Typography>}
          <GrowthTrack track={view.track} hue={look.hue} deep={look.deep} />
        </FlexBox>
      </FlexBox>
    </Panel>
  );
}
