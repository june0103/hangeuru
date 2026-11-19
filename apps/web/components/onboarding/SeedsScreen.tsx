'use client';

import { TextButton, useToast } from '@montage-ui/core';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { plantSeed } from '@/app/actions';
import { ACTION, SEED_SCREEN, seedLabel } from '@/lib/copy';
import type { ShowcaseView } from '@/lib/orchard/engine';
import { SEEDS } from '@/lib/rules';
import type { SeedKey } from '@/lib/types';

import BrandMark from '../BrandMark';
import { useOrchard, useOrchardScheme, useOrchardView } from '../orchard/OrchardProvider';
import PrimaryButton from '../orchard/WaterFill';

import './onboarding.css';

// 씨앗 고르기(spec 3.x): 게임에서 캐릭터를 고르듯 큰 과일 하나가 주인공이다. 패널과 바탕 상자는 쓰지 않는다.
// 화살표, 아래 작은 과일, 방향키로 바꾸고, 큰 과일은 잡고 좌우로 끌면 돈다. 자란 나무는 미리 보여 주지 않는다.
const ORDER = Object.keys(SEEDS) as SeedKey[];

function Thumb({ seed, current }: { seed: SeedKey; current: () => SeedKey }) {
  const box = useRef<HTMLSpanElement>(null);
  useOrchardView(box, (o, el) => o.fruit(el, seed, { hover: el.closest('.seed') as HTMLElement | null, selected: () => current() === seed }), [seed]);
  return <span className="fruit3d" ref={box} />;
}

export default function SeedsScreen() {
  const router = useRouter();
  const toast = useToast();
  const api = useOrchard();
  const [seed, setSeed] = useState<SeedKey>(ORDER[0]);
  const [planted, setPlanted] = useState(false);
  const [saving, startSave] = useTransition();
  const seedRef = useRef(seed);
  const hero = useRef<HTMLDivElement>(null);
  const soil = useRef<HTMLDivElement>(null);
  const meta = useRef<HTMLDivElement>(null);
  const done = useRef<HTMLHeadingElement>(null);
  const plantedBox = useRef<HTMLElement>(null);
  const pick = useRef<HTMLHeadingElement>(null);
  const showcase = useOrchardView<ShowcaseView>(hero, (o, el) => o.showcase(el, ORDER[0]), []);
  const planting = useOrchardView(soil, (o, el) => o.planting(el, ORDER[0]), []);
  useOrchardScheme(seed);

  const choose = (name: SeedKey, dir?: number) => {
    if (name === seedRef.current) return;
    const from = ORDER.indexOf(seedRef.current);
    const to = ORDER.indexOf(name);
    seedRef.current = name;
    setSeed(name);
    showcase.current?.set(name, dir ?? (to > from ? 1 : -1));
    // 이름과 설명이 바뀔 때 살짝 떠오른다
    const m = meta.current;
    if (m) { m.classList.remove('swap'); void m.offsetWidth; m.classList.add('swap'); }
  };
  const step = (d: number) => choose(ORDER[(ORDER.indexOf(seedRef.current) + d + ORDER.length) % ORDER.length], d);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (planted || (e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planted]);

  const plant = () => {
    setPlanted(true);
    // 글과 버튼이 새싹이 올라올 즈음 차례로 나오게, 등장 움직임을 처음부터 다시 건다.
    // 이 영역을 새로 만들면 3D 그림이 올라간 상자가 바뀌어 그림이 사라지니, 클래스만 다시 붙인다
    const box = plantedBox.current;
    if (box) { box.classList.remove('go'); void box.offsetWidth; box.classList.add('go'); }
    planting.current?.setSeed(seedRef.current);
    planting.current?.play();
    api?.ripple(window.innerWidth / 2, window.innerHeight / 2);
    requestAnimationFrame(() => done.current?.focus({ preventScroll: true }));
  };
  const again = () => {
    setPlanted(false);
    requestAnimationFrame(() => pick.current?.focus({ preventScroll: true }));
  };
  // 씨앗은 "내 씨앗 보러 가기"를 누를 때 저장한다. 그 전에는 다시 고를 수 있다
  const save = () => {
    startSave(async () => {
      const r = await plantSeed(seedRef.current);
      if (!r.ok) { toast({ content: r.message ?? ACTION.failed, variant: 'negative' }); return; }
      router.replace('/');
      router.refresh();
    });
  };

  return (
    <div className="ob">
      <div className="app">
        <header className="top"><BrandMark href="/seeds" /></header>
        <main className="stage select">
          <section className="screen pickone" aria-labelledby="h-seeds" hidden={planted}>
            <h1 id="h-seeds" className="rise" style={{ '--i': 0 } as React.CSSProperties} tabIndex={-1} ref={pick}>{SEED_SCREEN.title}</h1>
            <div className="showrow rise" style={{ '--i': 1 } as React.CSSProperties}>
              <button type="button" className="arrow prev" aria-label={SEED_SCREEN.prev} onClick={() => step(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 6l-6 6 6 6" /></svg>
              </button>
              <div className="fruit3d big" ref={hero} role="img" aria-label={SEED_SCREEN.heroLabel} />
              <button type="button" className="arrow next" aria-label={SEED_SCREEN.next} onClick={() => step(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
              </button>
            </div>
            <div className="meta rise" style={{ '--i': 2 } as React.CSSProperties} aria-live="polite" ref={meta}>
              <h2>{seedLabel(seed)}</h2>
              <p>{SEED_SCREEN.note[seed]}</p>
            </div>
            <fieldset className="options rise" style={{ '--i': 3 } as React.CSSProperties}>
              <legend className="sr">{SEED_SCREEN.legend}</legend>
              {ORDER.map(k => (
                <label className="seed" key={k}>
                  <input type="radio" name="seed" value={k} checked={seed === k} onChange={() => choose(k)} />
                  <span className="card"><Thumb seed={k} current={() => seedRef.current} /><span className="sr">{seedLabel(k)}</span></span>
                </label>
              ))}
            </fieldset>
            <div className="btn rise" style={{ '--i': 4 } as React.CSSProperties}>
              <PrimaryButton size="large" onClick={plant}>{SEED_SCREEN.plant(seed)}</PrimaryButton>
            </div>
          </section>
          <section ref={plantedBox} className="screen planted" aria-labelledby="h-planted" hidden={!planted}>
            <div className="hero3d" ref={soil} role="img" aria-label={SEED_SCREEN.plantedLabel} />
            <h1 id="h-planted" tabIndex={-1} ref={done}>{SEED_SCREEN.planted(seed)}</h1>
            <p>{SEED_SCREEN.plantedText}</p>
            <div className="btn">
              <PrimaryButton size="large" loading={saving} onClick={save}>{SEED_SCREEN.toHome}</PrimaryButton>
            </div>
            <div className="textbtn">
              <TextButton size="small" color="assistive" onClick={again}>{SEED_SCREEN.again}</TextButton>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
