'use client';

import { ThemeProvider } from '@montage-ui/core';
import { AppRouterCacheProvider } from '@montage-ui/nextjs';
import type { PropsWithChildren } from 'react';

export default function Providers({ children }: PropsWithChildren) {
  return (
    <ThemeProvider enableDarkMode>
      <AppRouterCacheProvider>{children}</AppRouterCacheProvider>
    </ThemeProvider>
  );
}
