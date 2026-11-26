'use client';

import { FlexBox, useToast } from '@montage-ui/core';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import type { checkIn, checkOut, harvest } from '@/app/actions';
import { LOCATION } from '@/lib/copy';
import { getPosition } from '@/lib/geo';
import { type AttendanceTime, FRUIT_DAYS } from '@/lib/rules';
import type { ActionResult } from '@/lib/types';
import type { BadgeView, CampView, CardModel, TodayView, TreeView, WeekView } from '@/lib/view';

import BadgesPanel from './BadgesPanel';
import CampPanel from './CampPanel';
import HarvestCardModal from './HarvestCardModal';
import { navHref } from './Header';
import MainActionButton from './MainActionButton';
import { useOrchardScheme } from './orchard/OrchardProvider';
import TodayPanel from './TodayPanel';
import TreePanel from './TreePanel';
import WeekPanel from './WeekPanel';

// spec 3.5 배치: 992px 이상은 세 칸 두 줄(왼쪽 오늘·이번 주, 가운데 내 씨앗, 오른쪽 오늘 그라운드·배지)로 한 화면에 다 보인다.
// 칸 나누기는 app/orchard.css 가 .p-today 등의 이름으로 한다. 미만은 한 단. 주 버튼은 모바일에서도 오늘 패널 안에 있다(3.10)
const SIDE = 340;
const GAP = 24;
const GAP_M = 16;

type Props = {
  today: TodayView;
  week: WeekView | null;
  tree: TreeView;
  attendanceTime: AttendanceTime;
  camp: CampView;
  card: CardModel | null;
  badges: BadgeView[];
  welcome: string | null;
  actions?: { checkIn: typeof checkIn; checkOut: typeof checkOut; harvest: typeof harvest };
};

export default function HomeView({ today, week, tree, attendanceTime, camp, card, badges, welcome, actions }: Props) {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const [harvesting, startHarvest] = useTransition();
  const [cardOpen, setCardOpen] = useState(false);
  const welcomed = useRef(false);
  useOrchardScheme(tree.seed);

  // 가입 직후 환영 토스트를 한 번 띄우고 주소에서 지운다 (spec 8.3)
  useEffect(() => {
    if (welcome && !welcomed.current) {
      welcomed.current = true;
      toast({ content: welcome, variant: 'positive' });
      router.replace('/');
    }
  }, [welcome, router, toast]);

  const report = (r: ActionResult) => {
    if (r.message) toast({ content: r.message, variant: r.ok ? 'positive' : 'negative' });
  };
  // 물 주는 장면이 끝난 뒤: 20일을 채운 날이면 열매가 맺히는 화면으로 간다(spec 3.14)
  const onGrown = (days: number) => { if (days === FRUIT_DAYS) router.push('/fruit'); };

  const onMain = () => {
    const act = today.button.action;
    if (!act || !actions) return;
    start(async () => {
      // 버튼을 누르면 위치부터 구한다. 구하지 못하면 기록하지 않고 안내만 한다(spec 2.8)
      const pos = await getPosition();
      if (typeof pos === 'string') {
        toast({ content: pos === 'denied' ? LOCATION.denied : LOCATION.unavailable, variant: 'normal' });
        return;
      }
      const r = await actions[act](pos);
      report(r);
    });
  };
  const onHarvest = () => {
    if (!actions) return;
    startHarvest(async () => {
      const r = await actions.harvest();
      if (r.ok) setCardOpen(true); else report(r);
    });
  };

  const button = <MainActionButton view={today.button} pending={pending} onAction={onMain} />;
  const todayPanel = <TodayPanel view={today} button={button} />;
  const weekPanel = week && <WeekPanel view={week} />;
  const treePanel = (
    <TreePanel
      view={tree}
      attendanceTime={attendanceTime}
      harvesting={harvesting}
      onHarvest={actions ? onHarvest : undefined}
      onOpenCard={() => setCardOpen(true)}
      onGrown={actions ? onGrown : undefined}
    />
  );
  const campPanel = <CampPanel view={camp} gardenHref={navHref('/garden', !actions)} />;

  return (
    <>
      {/* 992px 이상은 두 단, 미만은 한 단에 오늘, 내 나무, 이번 주, 오늘 그라운드 순서 */}
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
          <div className="p-badges"><BadgesPanel badges={badges} /></div>
        </div>
      </FlexBox>
      {actions && <HarvestCardModal open={cardOpen} onOpenChange={setCardOpen} model={card} />}
    </>
  );
}
