'use client';

import { Button } from '@montage-ui/core';

import type { TodayView } from '@/lib/view';

// 홈의 주 버튼(출근하기, 퇴근하기 등). 오늘 패널과 모바일 고정 영역이 같이 쓴다 (spec 3.5, 3.10)
export default function MainActionButton({ view, pending, onAction }: { view: TodayView['button']; pending: boolean; onAction: () => void }) {
  return (
    <Button
      size="large"
      fullWidth
      variant={view.variant}
      color={view.color}
      disabled={!view.action}
      loading={pending}
      onClick={onAction}
    >
      {view.label}
    </Button>
  );
}
