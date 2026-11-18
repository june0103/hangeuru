'use client';

import { Box, keyframes } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import type { KeyboardEvent } from 'react';

import { type Paint, type Primitive, type Shape, SIZES, VIEWBOX, fruitShapes, treeModel } from '@/lib/tree';
import type { SeedKey } from '@/lib/types';

// spec 4.3, 4.6의 모션 수치
const POP_MS = 450;
const RING_MS = 1600;

const pop = keyframes`
  0% { transform: scale(.3); opacity: 0; }
  60% { transform: scale(1.12); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
`;
const ring = keyframes`
  0% { transform: scale(.7); opacity: .9; }
  100% { transform: scale(1.35); opacity: 0; }
`;

// 나무 색 역할을 CSS 변수로 둔다. 라이트·다크 값은 spec 4.5
const paint = (p: Paint | undefined) => (p === undefined ? 'none' : p.startsWith('#') ? p : `var(--tree-${p})`);

function Prim({ p }: { p: Primitive }) {
  if (p.type === 'circle') return <circle cx={p.cx} cy={p.cy} r={p.r} fill={paint(p.fill)} />;
  if (p.type === 'ellipse') {
    return (
      <ellipse cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry} fill={paint(p.fill)}
        transform={p.rotate ? `rotate(${p.rotate} ${p.cx} ${p.cy})` : undefined} />
    );
  }
  return (
    <path d={p.d} fill={paint(p.fill)} stroke={p.stroke ? paint(p.stroke) : undefined}
      strokeWidth={p.strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  );
}

export function Shapes({ list }: { list: Shape[] }) {
  return (
    <>
      {list.map((s, i) => (
        <path key={i} d={s.d} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.sw}
          strokeLinecap={s.stroke ? 'round' : undefined} opacity={s.o} />
      ))}
    </>
  );
}

/** 씨앗 선택과 브랜드 마크에 쓰는 열매 하나 */
export function FruitIcon({ seed, variant }: { seed: SeedKey; variant: 'seedPicker' | 'brand' }) {
  const s = SIZES[variant];
  const w = s.w;
  const h = 'h' in s ? s.h : +(w * 1.2).toFixed(1);
  return (
    <svg width={w} height={h} viewBox={s.viewBox} aria-hidden="true" style={{ display: 'block', flexShrink: 0 }}>
      <Shapes list={fruitShapes(seed, s.r)} />
    </svg>
  );
}

type Props = {
  seed: SeedKey;
  days: number;
  harvested: boolean;
  label: string;
  mini?: boolean;
  /** 방금 출근이나 수확으로 새로 생긴 요소 하나만 튀어 오르게 한다 */
  animateNewest?: boolean;
  /** 수확할 수 있을 때 열매를 누르면 */
  onHarvest?: () => void;
  harvestLabel?: string;
};

export default function TreeFigure({ seed, days, harvested, label, mini = false, animateNewest = false, onHarvest, harvestLabel }: Props) {
  const m = treeModel(seed, days, harvested);
  const popGroup = (newest: boolean, ox: number, oy: number, children: React.ReactNode, key?: string) => (
    <g key={key} className={newest && animateNewest ? 'is-pop' : undefined} style={{ transformOrigin: `${ox}px ${oy}px` }}>
      {children}
    </g>
  );
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHarvest?.(); }
  };

  return (
    <Box
      as="svg"
      role="img"
      aria-label={label}
      viewBox={`0 0 ${VIEWBOX.w} ${VIEWBOX.h}`}
      width={mini ? SIZES.mini.w : '100%'}
      height={mini ? SIZES.mini.h : undefined}
      sx={(theme: Theme) => ({
        display: 'block',
        height: mini ? SIZES.mini.h : 'auto',
        overflow: 'visible',
        '--tree-leaf': theme.semantic.foreground.positive.primary,
        '--tree-leafDark': theme.atomic.green[40],
        '--tree-trunk': theme.atomic.orange[30],
        '--tree-soil': theme.atomic.orange[20],
        '--tree-seed': theme.atomic.orange[40],
        "html[data-theme='dark'] &": {
          '--tree-leafDark': theme.atomic.green[50],
          '--tree-trunk': theme.atomic.orange[40],
          '--tree-soil': theme.atomic.orange[30],
          '--tree-seed': theme.atomic.orange[60],
        },
        '.is-pop': { animation: `${pop} ${POP_MS}ms cubic-bezier(.34, 1.56, .64, 1) both` },
        '.fruit-btn': { cursor: 'pointer', outline: 'none' },
        '.fruit-ring': {
          fill: 'none',
          stroke: theme.semantic.foreground.brand.primary,
          strokeWidth: 2,
          transformBox: 'fill-box',
          transformOrigin: 'center',
          animation: `${ring} ${RING_MS}ms ease-out infinite`,
        },
        '.fruit-btn:focus-visible .fruit-ring': { animation: 'none', strokeWidth: 3 },
        '.fruit-hit-m': { display: 'none' },
        '@media (max-width: 767px)': { '.fruit-hit': { display: 'none' }, '.fruit-hit-m': { display: 'inline' } },
        '@media (prefers-reduced-motion: reduce)': {
          '.is-pop': { animation: 'none' },
          '.fruit-ring': { animation: 'none' },
        },
      })}
    >
      {m.base.map((p, i) => <Prim key={`base-${i}`} p={p} />)}
      {m.parts.map(part =>
        popGroup(part.newest, part.origin.x, part.origin.y, part.items.map((p, i) => <Prim key={i} p={p} />), part.key),
      )}
      {m.fruit && (mini || !onHarvest ? (
        <g transform={`translate(${m.fruit.x} ${m.fruit.y})`}>
          <Shapes list={m.fruit.shapes} />
        </g>
      ) : (
        <g
          transform={`translate(${m.fruit.x} ${m.fruit.y})`}
          className="fruit-btn"
          role="button"
          tabIndex={0}
          aria-label={harvestLabel}
          onClick={onHarvest}
          onKeyDown={onKey}
        >
          <circle className="fruit-ring" r={m.fruit.ringR} />
          {/* 터치 영역은 보이는 크기와 상관없이 지름 64px (spec 3.10). 모바일 그림 폭 220px에서는 반지름을 키운다 */}
          <circle className="fruit-hit" r={m.fruit.hitR} fill="transparent" />
          <circle className="fruit-hit-m" r={+(m.fruit.hitR * VIEWBOX.w / SIZES.homeMobile).toFixed(1)} fill="transparent" />
          {popGroup(m.fruit.newest, 0, 0, <Shapes list={m.fruit.shapes} />)}
        </g>
      ))}
      {m.basket && popGroup(m.basket.newest, m.basket.x, m.basket.y, (
        <g transform={`translate(${m.basket.x} ${m.basket.y})`}>
          <Prim p={m.basket.handle} />
          <g transform={`translate(${m.basket.fruitAt.x} ${m.basket.fruitAt.y})`}>
            <Shapes list={m.basket.fruitShapes} />
          </g>
          <Prim p={m.basket.body} />
        </g>
      ))}
    </Box>
  );
}
