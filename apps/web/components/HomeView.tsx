'use client';

import { Box, FlexBox, useToast } from '@montage-ui/core';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { checkIn, checkOut, harvest } from '@/app/actions';
import { LOCATION } from '@/lib/copy';
import { getPosition } from '@/lib/geo';
import type { ActionResult } from '@/lib/types';
import type { CampView, CardModel, TodayView, TreeView, WeekView } from '@/lib/view';

import CampPanel from './CampPanel';
import HarvestCardModal from './HarvestCardModal';
import MainActionButton from './MainActionButton';
import TodayPanel from './TodayPanel';
import TreePanel from './TreePanel';
import WeekPanel from './WeekPanel';

// spec 3.5 배치: 992px 이상 2단(왼쪽 340px), 미만 1단. 3.10 모바일 고정 출근 버튼
const SIDE = 340;
const GAP = 24;
const GAP_M = 16;
const POP_MS = 600;

type Props = {
  today: TodayView;
  week: WeekView | null;
  tree: TreeView;
  camp: CampView;
  card: CardModel | null;
  welcome: string | null;
};

export default function HomeView({ today, week, tree, camp, card, welcome }: Props) {
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  const [pending, start] = useTransition();
  const [harvesting, startHarvest] = useTransition();
  const [animate, setAnimate] = useState(false);
  const [cardOpen, setCardOpen] = useState(false);
  const welcomed = useRef(false);

  // 가입 직후 환영 토스트를 한 번 띄우고 주소에서 지운다 (spec 8.3)
  useEffect(() => {
    if (welcome && params.get('welcome') === '1' && !welcomed.current) {
      welcomed.current = true;
      toast({ content: welcome, variant: 'positive' });
      router.replace('/');
    }
  }, [welcome, params, router, toast]);

  const report = (r: ActionResult) => {
    if (r.message) toast({ content: r.message, variant: r.ok ? 'positive' : 'negative' });
  };
  const pop = () => { setAnimate(true); setTimeout(() => setAnimate(false), POP_MS); };

  const onMain = () => {
    const act = today.button.action;
    if (!act) return;
    start(async () => {
      // 버튼을 누르면 위치부터 구한다. 구하지 못하면 기록하지 않고 안내만 한다(spec 2.8)
      const pos = await getPosition();
      if (typeof pos === 'string') {
        toast({ content: pos === 'denied' ? LOCATION.denied : LOCATION.unavailable, variant: 'normal' });
        return;
      }
      const r = act === 'checkIn' ? await checkIn(pos) : await checkOut(pos);
      if (r.ok && act === 'checkIn' && r.message) pop();
      report(r);
    });
  };
  const onHarvest = () => {
    startHarvest(async () => {
      const r = await harvest();
      if (r.ok) { pop(); setCardOpen(true); } else report(r);
    });
  };

  const button = <MainActionButton view={today.button} pending={pending} onAction={onMain} />;
  const todayPanel = <TodayPanel view={today} button={button} />;
  const weekPanel = week && <WeekPanel view={week} />;
  const treePanel = (
    <TreePanel view={tree} animateNewest={animate} harvesting={harvesting} onHarvest={onHarvest} onOpenCard={() => setCardOpen(true)} />
  );
  const campPanel = <CampPanel view={camp} />;

  return (
    <>
      {/* 992px 이상은 두 단, 미만은 한 단에 오늘, 내 나무, 이번 주, 오늘 캠프 순서 */}
      <FlexBox
        gap={GAP}
        alignItems="flex-start"
        sx={{
          '& > div': { display: 'flex', flexDirection: 'column', gap: GAP, minWidth: 0 },
          '@media (max-width: 991px)': {
            flexDirection: 'column', alignItems: 'stretch', gap: GAP_M,
            '& > div': { display: 'contents' },
            '& .p-today': { order: 1 }, '& .p-tree': { order: 2 }, '& .p-week': { order: 3 }, '& .p-camp': { order: 4 },
          },
        }}
      >
        <div style={{ flex: `0 0 ${SIDE}px` }}>
          <div className="p-today">{todayPanel}</div>
          {weekPanel && <div className="p-week">{weekPanel}</div>}
        </div>
        <div style={{ flex: 1 }}>
          <div className="p-tree">{treePanel}</div>
          <div className="p-camp">{campPanel}</div>
        </div>
      </FlexBox>
      {/* 768px 미만: 하단 탭 바 바로 위 고정 버튼 */}
      <Box
        sx={(theme) => ({
          display: 'none',
          '@media (max-width: 767px)': {
            display: 'block', position: 'fixed', left: 0, right: 0, zIndex: 9,
            bottom: 'calc(56px + env(safe-area-inset-bottom, 0px))',
            padding: '16px 20px 12px',
            background: `linear-gradient(to top, ${theme.semantic.background.neutral.secondary} 72%, transparent)`,
          },
        })}
      >
        {button}
      </Box>
      <HarvestCardModal open={cardOpen} onOpenChange={setCardOpen} model={card} />
    </>
  );
}
