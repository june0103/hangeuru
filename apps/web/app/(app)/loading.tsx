'use client';

import { FlexBox, Skeleton } from '@montage-ui/core';

// 패널 자리에 같은 크기의 Skeleton. 글자는 없다 (spec 9.4)
export default function Loading() {
  return (
    <FlexBox gap={24} alignItems="flex-start" sx={{ '@media (max-width: 991px)': { flexDirection: 'column', alignItems: 'stretch', gap: 16 } }}>
      <FlexBox flexDirection="column" gap={24} sx={{ flex: '0 0 340px', '@media (max-width: 991px)': { flex: 'none', gap: 16 } }}>
        <Skeleton variant="rectangle" width="100%" height={260} radius={20} />
        <Skeleton variant="rectangle" width="100%" height={200} radius={20} />
      </FlexBox>
      <FlexBox flexDirection="column" gap={24} sx={{ flex: 1, minWidth: 0, '@media (max-width: 991px)': { gap: 16 } }}>
        <Skeleton variant="rectangle" width="100%" height={380} radius={20} />
        <Skeleton variant="rectangle" width="100%" height={140} radius={20} />
      </FlexBox>
    </FlexBox>
  );
}
