'use client';

import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import { TREE } from '@/lib/copy';
import { type StageView, stageOf } from '@/lib/orchard/engine';
import { burst, dashOf, floatChip, levelBadgeSvg, levelLabel, levelLook } from '@/lib/orchard/extras';
import { FRUIT_DAYS } from '@/lib/rules';
import type { SeedKey } from '@/lib/types';

import { useOrchard, useOrchardView } from './orchard/OrchardProvider';

// 나무 그림(spec 4장). 씨앗마다 다른 나무가 출근일에 따라 자란다. 그리기는 lib/orchard/engine.js 가 한다.
// 누르면 살짝 휘청이고 잎이 떨어진다. 출근해서 날이 늘면: 열매 전에는 물뿌리개가 물을 주고 자라고, 열매 뒤에는 열매가 하나 더 맺힌다.
const RATIO = '240 / 260';
const MINI = { w: 72, h: 78 };
const SEED_ICON = 44;
const HARVEST_MS = 800;
const GROW_MS = 450;

/** 씨앗 선택에 쓰는 열매 하나(3D) */
export function FruitIcon({ seed, selected }: { seed: SeedKey; selected?: () => boolean }) {
  const box = useRef<HTMLSpanElement>(null);
  const sel = useRef(selected);
  useEffect(() => { sel.current = selected; });
  useOrchardView(box, (o, el) => o.fruit(el, seed, { hover: el.parentElement, selected: () => !!sel.current?.() }), [seed]);
  return <span ref={box} aria-hidden="true" style={{ display: 'block', flex: 'none', width: SEED_ICON, height: SEED_ICON }} />;
}

/** 달려 있는 열매 수: 열매가 달린 나무는 fruits 그대로, 수확한 뒤에는 20일 뒤로 더 맺힌 것만 */
const hanging = (fruits: number, days: number, harvested: boolean) => (harvested ? Math.max(0, days - FRUIT_DAYS) : fruits);

type Props = {
  seed: SeedKey;
  days: number;
  /** 열매 수(20일 전에는 0) */
  fruits?: number;
  harvested: boolean;
  label: string;
  mini?: boolean;
  /** 수확할 수 있을 때 나무를 누르면 */
  onHarvest?: () => void;
  harvestLabel?: string;
  /** 출근해서 자라는 장면(물 주기, 열매 추가)이 끝난 뒤. 새 출근일을 준다 */
  onGrown?: (days: number) => void;
  /** 레벨 표시를 붙일지(홈의 내 나무만) */
  level?: boolean;
};

export default function TreeFigure({ seed, days, fruits = 0, harvested, label, mini = false, onHarvest, harvestLabel, onGrown, level = false }: Props) {
  const api = useOrchard();
  const wrap = useRef<HTMLSpanElement>(null);
  const fig = useRef<HTMLSpanElement>(null);
  const badge = useRef<HTMLSpanElement>(null);
  // 화면에 그려진 상태. 출근하면 props 가 먼저 바뀌고, 물 주는 장면이 끝난 뒤에 이 값이 따라간다
  const [shown, setShown] = useState({ days, harvested });
  const grew = useRef(false);
  const busy = useRef(false);
  const grownRef = useRef(onGrown);
  useEffect(() => { grownRef.current = onGrown; });

  const kind = stageOf(shown.days, shown.harvested);
  const view = useOrchardView<StageView>(
    fig,
    (o, el) => o.stage(el, kind, seed, {
      live: !mini, sway: mini ? 0.16 : 0.24, scale: mini ? 1.04 : 1, touch: wrap.current,
      fruits: hanging(fruits, shown.days, shown.harvested),
    }),
    [seed, kind, mini],
    v => {
      // 자라서 새 모습이 된 나무는 한 번 통 튀고 잎을 떨군다
      if (!grew.current) return;
      grew.current = false;
      setTimeout(() => { v.bounce(); v.shower(7); }, GROW_MS);
    },
  );

  useEffect(() => {
    if (days === shown.days && harvested === shown.harvested) return;
    const v = view.current;
    const el = wrap.current;
    const at = () => { const r = el!.getBoundingClientRect(); return [r.left + r.width / 2, r.top] as const; };
    const next = { days, harvested };
    // 하루 출근한 것이 아니면(다른 사람 화면, 처음 그릴 때, 움직임 줄이기) 바로 맞춘다
    if (mini || !v || !el || api?.reduce || days !== shown.days + 1 || harvested !== shown.harvested) {
      if (harvested && !shown.harvested && el && !mini) { const [x, y] = at(); burst(x, y + el.offsetHeight * 0.4, 14); }
      setShown(next);
      return;
    }
    if (busy.current) return;
    busy.current = true;
    const done = (text: string) => {
      busy.current = false;
      const [x, y] = at();
      floatChip(x, y + 24, text);
      setShown(next);
      grownRef.current?.(days);
    };
    const r = el.getBoundingClientRect();
    if (r.top < 56 || r.bottom > window.innerHeight - 72) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (shown.days >= FRUIT_DAYS) {
      // 열매가 열린 뒤: 그 자리에서 열매가 하나 더 맺힌다
      const more = v.addFruit();
      const [x, y] = at();
      burst(x, y + el.offsetHeight * 0.4, 10);
      done(more ? TREE.plusFruit : TREE.plusDay);
    } else {
      // 열매 전: 물뿌리개가 물을 준 뒤에 자란다
      grew.current = true;
      v.water(() => done(TREE.plusDay));
    }
  }, [days, harvested, shown, mini, api, view]);

  const look = useMemo(() => levelLook(shown.days, shown.harvested), [shown]);
  useEffect(() => {
    const p = badge.current?.querySelector<SVGPathElement>('.p');
    if (p) p.style.strokeDasharray = dashOf(look);
  }, [look]);

  const harvest = () => {
    const el = wrap.current as (HTMLSpanElement & { __dragged?: boolean }) | null;
    if (!el || !onHarvest || busy.current) return;
    if (el.__dragged) { el.__dragged = false; return; }   // 끌어서 흔든 것은 수확이 아니다
    busy.current = true;
    view.current?.poke(0, 1.5);
    const r = el.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height * 0.4, 14);
    setTimeout(() => { busy.current = false; onHarvest(); }, api?.reduce ? 0 : HARVEST_MS);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); harvest(); }
  };

  const button = !mini && !!onHarvest;
  return (
    <span
      ref={wrap}
      className="orchard-tree"
      role={button ? 'button' : 'img'}
      tabIndex={button ? 0 : undefined}
      aria-label={button ? harvestLabel : label}
      onClick={button ? harvest : undefined}
      onKeyDown={button ? onKey : undefined}
      style={mini ? { width: MINI.w, height: MINI.h, flex: 'none' } : { width: '100%', aspectRatio: RATIO }}
    >
      <span ref={fig} className="orchard-fig" />
      {level && !mini && (
        <span
          ref={badge}
          className="orchard-lv"
          role="img"
          aria-label={levelLabel(look)}
          style={{ '--o-lv': look.hue } as React.CSSProperties}
          dangerouslySetInnerHTML={{ __html: levelBadgeSvg(look) }}
        />
      )}
    </span>
  );
}
