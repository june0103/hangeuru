'use client';

import { useToast } from '@montage-ui/core';
import { useEffect, useRef } from 'react';

import type { ActionResult } from '@/lib/types';

/**
 * 서버 액션 결과를 한 번만 처리한다 (spec 8.1).
 * 성공 message는 positive 토스트, 실패 message는 negative 토스트로 띄운다
 */
export function useActionResult(state: ActionResult | null, onOk?: (r: Extract<ActionResult, { ok: true }>) => void) {
  const toast = useToast();
  const seen = useRef<ActionResult | null>(null);
  const cb = useRef(onOk);
  useEffect(() => { cb.current = onOk; });
  useEffect(() => {
    if (!state || seen.current === state) return;
    seen.current = state;
    if (state.ok) {
      cb.current?.(state);
      if (state.message) toast({ content: state.message, variant: 'positive' });
    } else if (state.message) {
      toast({ content: state.message, variant: 'negative' });
    }
  }, [state, toast]);
}
