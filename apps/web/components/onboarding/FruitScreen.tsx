'use client';

import { TextButton } from '@montage-ui/core';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';

import { FRUIT_SCREEN } from '@/lib/copy';
import type { StageView } from '@/lib/orchard/engine';
import { FRUIT_BASE } from '@/lib/rules';
import type { SeedKey } from '@/lib/types';

import BrandMark from '../BrandMark';
import { useOrchardScheme, useOrchardView } from '../orchard/OrchardProvider';
import PrimaryButton from '../orchard/WaterFill';

import './onboarding.css';

// 20일을 채운 날의 화면(spec 3.x): 꽃이 핀 내 나무에 빛이 내려오고 열매가 하나씩 맺힌다. 내가 고른 씨앗의 나무만 나온다.
// 닫기를 누르면 홈으로 돌아가 계속 출근할 수 있다.
const START_MS = 320;

export default function FruitScreen({ seed }: { seed: SeedKey; name: string }) {
  const router = useRouter();
  const box = useRef<HTMLDivElement>(null);
  const tree = useOrchardView<StageView>(
    box,
    (o, el) => o.stage(el, 4, seed, { fruits: FRUIT_BASE, sway: 0.2, touch: el }),
    [seed],
    v => { setTimeout(() => v.ripen(FRUIT_BASE), START_MS); },
  );
  useOrchardScheme(seed);
  const [first, second] = FRUIT_SCREEN.title(seed);

  return (
    <div className="ob">
      <div className="app">
        <header className="top"><BrandMark href="/" /></header>
        <main className="stage select">
          <section className="screen planted fruiting" aria-labelledby="h-fruit">
            <div className="hero3d" role="img" aria-label={FRUIT_SCREEN.heroLabel}>
              <div className="slot" ref={box} />
            </div>
            <span className="eyebrow" lang="en">{FRUIT_SCREEN.eyebrow}</span>
            <h1 id="h-fruit">{first}<br />{second}</h1>
            <p>{FRUIT_SCREEN.text}</p>
            <div className="btn">
              <PrimaryButton size="large" onClick={() => { router.push('/'); router.refresh(); }}>{FRUIT_SCREEN.close}</PrimaryButton>
            </div>
            <div className="textbtn">
              <TextButton size="small" color="assistive" onClick={() => tree.current?.ripen(FRUIT_BASE)}>{FRUIT_SCREEN.replay}</TextButton>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
