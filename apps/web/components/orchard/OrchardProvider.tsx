'use client';

import { Global, addOpacity } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { type DependencyList, type PropsWithChildren, type RefObject, createContext, useContext, useEffect, useRef, useState } from 'react';

import type { Orchard, SeedKey } from '@/lib/orchard/engine';

// 과수원 디자인의 바탕(spec 3.2): 꽃 배경, 유리 패널, 3D 그림을 그리는 엔진을 한 번만 불러 화면들이 같이 쓴다.
// 엔진은 three.js 를 쓰는 클라이언트 전용 모듈이라 화면이 뜬 뒤에 따로 불러온다.

/* 화면 스타일(app/orchard.css, components/onboarding/onboarding.css)이 쓰는 색 변수. 값은 몽타주 theme 토큰에서 온다.
   유리의 농도와 빛은 라이트·다크가 달라 다크 값을 따로 둔다 */
const vars = (theme: Theme) => {
  const s = theme.semantic;
  const white = s.static.white;
  const black = s.static.black;
  return {
    ':root': {
      '--o-page': s.background.neutral.secondary,
      '--o-panel': s.background.neutral.primary,
      '--o-menu': s.background.neutral.primary,
      '--o-fg': s.foreground.neutral.primary,
      '--o-fg2': s.foreground.neutral.secondary,
      '--o-fg3': s.foreground.neutral.tertiary,
      '--o-line': s.line.neutral.secondary,
      '--o-accent': s.foreground.brand.primary,
      '--o-white': white,
      '--o-black': black,
      '--o-tint': '54%',
      '--o-inset': '44%',
      // 유리 창 안의 칸(입력 칸, 선택 상자)과 아래 버튼 줄
      '--o-cell': addOpacity(white, 0.62),
      '--o-cell-edge': addOpacity(s.line.neutral.primary, 0.6),
      '--o-bar': '78%',
      // 유리 창(프로필) 바탕의 농도. 딤 위에서 회색으로 탁해지지 않게 패널보다 짙다
      '--o-glass-modal': '88%',
      '--o-edge': addOpacity(white, 0.7),
      '--o-sheen': addOpacity(white, 0.8),
      '--o-shadow': addOpacity(black, 0.24),
      '--oc-b1': theme.atomic.pink[90],
      '--oc-b2': theme.atomic.orange[90],
      '--oc-b3': theme.atomic.lightBlue[90],
      '--oc-b4': theme.atomic.violet[90],
    },
    "html[data-theme='dark']": {
      '--o-tint': '46%',
      '--o-inset': '40%',
      '--o-cell': addOpacity(white, 0.08),
      '--o-cell-edge': addOpacity(white, 0.14),
      '--o-bar': '62%',
      '--o-glass-modal': '80%',
      // 다크에서는 색 번짐을 어둡게(유리 창 바탕)
      '--oc-b1': addOpacity(theme.atomic.pink[60], 0.3),
      '--oc-b2': addOpacity(theme.atomic.orange[50], 0.26),
      '--oc-b3': addOpacity(theme.atomic.lightBlue[50], 0.24),
      '--oc-b4': addOpacity(theme.atomic.violet[50], 0.3),
      '--o-edge': addOpacity(white, 0.1),
      '--o-sheen': addOpacity(white, 0.1),
      '--o-shadow': addOpacity(black, 0.7),
    },
  };
};

const Ctx = createContext<Orchard | null>(null);

export default function OrchardProvider({ children }: PropsWithChildren) {
  const [api, setApi] = useState<Orchard | null>(null);

  useEffect(() => {
    let alive = true;
    let watch: MutationObserver | null = null;
    import('@/lib/orchard/engine').then(m => {
      if (!alive) return;
      const o = m.createOrchard();
      o.mountBackground();
      // 테마를 바꾸면 배경 색과 3D 그림의 조명도 같이 바뀐다
      watch = new MutationObserver(() => o.refreshTheme());
      watch.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
      setApi(o);
    }).catch(() => { /* 엔진을 못 불러와도 화면은 그대로 쓸 수 있다(배경과 3D 그림만 빠진다) */ });
    return () => { alive = false; watch?.disconnect(); };
  }, []);

  return (
    <Ctx.Provider value={api}>
      <Global styles={vars} />
      {children}
    </Ctx.Provider>
  );
}

export const useOrchard = () => useContext(Ctx);

/** 배경 꽃의 색 계열을 내 씨앗에 맞춘다 */
export function useOrchardScheme(seed: SeedKey | null | undefined) {
  const api = useOrchard();
  useEffect(() => { if (api && seed) api.setScheme(seed); }, [api, seed]);
}

type Disposable = { dispose: () => void };

/**
 * 3D 그림 하나를 ref 가 가리키는 상자에 올린다. deps 가 바뀌면 다시 만들고, 사라질 때 치운다.
 * 돌려주는 ref 로 그림의 동작(흔들기, 물 주기 등)을 부른다. 엔진이 아직 안 왔으면 current 는 null 이다.
 */
export function useOrchardView<T extends Disposable>(
  box: RefObject<HTMLElement | null>,
  make: (api: Orchard, el: HTMLElement) => T | null,
  deps: DependencyList,
  onReady?: (view: T) => void,
) {
  const api = useOrchard();
  const view = useRef<T | null>(null);
  const makeRef = useRef(make);
  const readyRef = useRef(onReady);
  useEffect(() => { makeRef.current = make; readyRef.current = onReady; });
  useEffect(() => {
    const el = box.current;
    if (!api || !el) return;
    const v = makeRef.current(api, el);
    view.current = v;
    if (v) readyRef.current?.(v);
    return () => { view.current = null; v?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [api, box, ...deps]);
  return view;
}

/** 배경 꽃이 머무는 자리를 화면 종류에 맞춘다 */
export function useOrchardLayout(name: 'splash' | 'auth' | 'seeds' | 'app') {
  const api = useOrchard();
  useEffect(() => { api?.setLayout(name); }, [api, name]);
}
