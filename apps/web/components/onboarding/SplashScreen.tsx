'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef } from 'react';

import { SPLASH } from '@/lib/copy';

import BrandMark from '../BrandMark';
import { useOrchardView } from '../orchard/OrchardProvider';
import PrimaryButton from '../orchard/WaterFill';

import './onboarding.css';

// 스플래시(spec 3.x): 스크롤을 따라 장면이 이어진다. 과일 넷 → 씨앗 하나 → 흙에 내려앉음. 글 세 장이 같이 바뀐다.
// 넓은 화면은 스크롤하거나 아래로 버튼으로, 좁은 화면(767px 이하)은 화면을 누르면 다음 장면으로 넘어간다.
const N = SPLASH.scenes.length;
const MOBILE = 767;

export default function SplashScreen() {
  const router = useRouter();
  const hero = useRef<HTMLDivElement>(null);
  const caps = useRef<(HTMLElement | null)[]>([]);
  const dots = useRef<(HTMLLIElement | null)[]>([]);
  const next = useRef<HTMLButtonElement>(null);
  const paintRef = useRef<() => void>(() => {});
  const view = useOrchardView(hero, (o, el) => o.journey(el), [], () => paintRef.current());

  const progress = useCallback(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  }, []);

  useEffect(() => {
    const paint = () => {
      const p = progress();
      const at = p * (N - 1);
      view.current?.set(p);
      caps.current.forEach((c, i) => {
        if (!c) return;
        const d = at - i;
        const o = Math.max(0, 1 - Math.abs(d) * 1.9);
        c.style.opacity = String(o);
        c.style.transform = `translate3d(0,${-d * 34}px,0)`;
        c.style.visibility = o < 0.02 ? 'hidden' : 'visible';
        c.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
      });
      dots.current.forEach((d, i) => { if (d) d.className = Math.round(at) === i ? 'on' : ''; });
      if (next.current) {
        const last = at > N - 1.4;
        next.current.style.opacity = last ? '0' : '1';
        next.current.style.pointerEvents = last ? 'none' : 'auto';
      }
    };
    paintRef.current = paint;
    const look = (e: PointerEvent) => view.current?.look((e.clientX / window.innerWidth - 0.5) * 2, -(e.clientY / window.innerHeight - 0.5) * 2);
    window.addEventListener('scroll', paint, { passive: true });
    window.addEventListener('resize', paint);
    window.addEventListener('pointermove', look, { passive: true });
    paint();
    return () => {
      window.removeEventListener('scroll', paint);
      window.removeEventListener('resize', paint);
      window.removeEventListener('pointermove', look);
    };
  }, [progress, view]);

  // 다음 장면으로 넘긴다. 마지막 장면이라 넘어갈 곳이 없으면 false
  const advance = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const at = progress() * (N - 1);
    if (at > N - 1.05) return false;   // 마지막 장면에서는 넘어갈 곳이 없다(시작하기로 간다)
    window.scrollTo({ top: max * Math.min(N - 1, Math.floor(at + 0.05) + 1) / (N - 1), behavior: 'smooth' });
    return true;
  };

  return (
    <div className="ob">
      <div className="app journey">
        <header className="top">
          <BrandMark href="/start" />
          <Link className="skip" href="/login">{SPLASH.skip}</Link>
        </header>
        <main className="track">
          {/* 좁은 화면에서는 화면 아무 곳이나 누르면 다음 장면으로 넘어간다. 키보드와 스크린리더는 아래 링크와 스크롤로 간다 */}
          <div
            className="pin"
            onClick={e => {
              if (window.innerWidth > MOBILE || (e.target as HTMLElement).closest('a, button')) return;
              advance();
            }}
          >
            <div className="hero3d" ref={hero} role="img" aria-label={SPLASH.heroLabel} />
            <div className="caps">
              {SPLASH.scenes.map((s, i) => {
                const Title = i === 0 ? 'h1' : 'h2';
                return (
                  <section key={s.eyebrow} className="cap" ref={el => { caps.current[i] = el; }} aria-labelledby={`h-splash-${i}`}>
                    <span className="eyebrow" lang="en">{s.eyebrow}</span>
                    <Title id={`h-splash-${i}`}>{s.title.map((line, n) => <span key={line}>{n > 0 && <br />}{line}</span>)}</Title>
                    <p>{s.text.map((line, n) => <span key={line}>{n > 0 && <br />}{line}</span>)}</p>
                    {i === N - 1 && (
                      <div className="btn">
                        <PrimaryButton size="large" onClick={() => router.push('/login')}>{SPLASH.start}</PrimaryButton>
                      </div>
                    )}
                  </section>
                );
              })}
            </div>
            <button type="button" className="hint" ref={next} aria-label={SPLASH.nextLabel} onClick={e => { e.stopPropagation(); advance(); }}>
              <span>{SPLASH.down}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9.5l6 6 6-6" /></svg>
            </button>
            {/* 모바일의 시작하기: 화면을 누를 때처럼 다음 장면(Step 1, Step 2)으로 넘기고, 마지막 장면에서 누르면 로그인으로 간다(spec 3.12) */}
            <Link className="startglass" href="/login" onClick={e => { if (advance()) e.preventDefault(); }}>
              <span>{SPLASH.start}</span>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 6l6 6-6 6" /></svg>
            </Link>
            <ol className="dots" aria-hidden="true">
              {SPLASH.scenes.map((s, i) => <li key={s.eyebrow} ref={el => { dots.current[i] = el; }} />)}
            </ol>
          </div>
        </main>
      </div>
    </div>
  );
}
