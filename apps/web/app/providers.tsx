'use client';

import { Global, RegionConfig, ThemeProvider } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { AppRouterCacheProvider } from '@montage-ui/nextjs';
import type { PropsWithChildren } from 'react';

import OrchardProvider from '@/components/orchard/OrchardProvider';

// 페이지 배경과 토스트 위치(spec 3.2, 3.10). 토스트 아래 여백은 화면마다 --app-toast-offset으로 바꾼다
const globalStyles = (theme: Theme) => ({
  // 바탕색은 html 이 갖고, body 는 비워서 뒤의 꽃 배경이 비치게 한다(app/orchard.css)
  html: { backgroundColor: theme.semantic.background.neutral.secondary },
  body: {
    // 한글도 어절 단위로 줄을 바꾸고, 띄어쓰기 없는 긴 글자만 글자 단위로 끊는다(spec 3.2)
    wordBreak: 'keep-all' as const,
    overflowWrap: 'anywhere' as const,
  },
  ':root': { '--app-toast-offset': '0px' },
});

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider enableDarkMode>
      <AppRouterCacheProvider>
        <Global styles={globalStyles} />
        <RegionConfig viewportBottom="var(--app-toast-offset, 0px)" />
        <OrchardProvider>{children}</OrchardProvider>
      </AppRouterCacheProvider>
    </ThemeProvider>
  );
}
