'use client';

import { useEffect, useState } from 'react';

import type { AttendanceTime } from '@/lib/rules';

type ActiveTime = NonNullable<AttendanceTime['active']>;

export function useAttendanceTimer({ completedMs, active }: AttendanceTime) {
  const [tick, setTick] = useState<{ session: ActiveTime; elapsedMs: number } | null>(null);

  useEffect(() => {
    if (!active) return;
    const started = performance.now();
    const update = () => {
      const elapsedMs = Math.min(performance.now() - started, active.remainingMs);
      setTick({ session: active, elapsedMs });
      if (elapsedMs >= active.remainingMs) window.clearInterval(timer);
    };
    const timer = window.setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [active]);

  const elapsedMs = tick?.session === active ? tick.elapsedMs : 0;
  const isRunning = active !== null && elapsedMs < active.remainingMs;
  const totalMs = isRunning ? completedMs + active.elapsedMs + elapsedMs : completedMs;

  return { totalMs, isRunning };
}
