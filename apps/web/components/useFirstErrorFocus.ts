'use client';

import { useEffect, useRef } from 'react';

type Focusable = { focus: (o?: FocusOptions) => void; scrollIntoView?: (o?: ScrollIntoViewOptions) => void } | null;

/**
 * 폼 오류가 나면 첫 오류 항목에 포커스를 주고 화면 가운데로 스크롤한다 (spec 3.11).
 * order: 화면 위에서부터의 항목 이름. refs: 항목 이름별 포커스 대상
 */
export function useFirstErrorFocus(errors: Record<string, string> | undefined, order: readonly string[]) {
  const refs = useRef<Record<string, Focusable>>({});
  useEffect(() => {
    if (!errors) return;
    const first = order.find(k => errors[k]);
    const el = first ? refs.current[first] : null;
    if (!el) return;
    el.focus({ preventScroll: true });
    el.scrollIntoView?.({ block: 'center' });
  }, [errors, order]);
  const bind = (name: string) => (el: Focusable) => { refs.current[name] = el; };
  return bind;
}
