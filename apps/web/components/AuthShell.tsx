'use client';

import { Box, containerStyle } from '@montage-ui/core';
import type { PropsWithChildren } from 'react';

import Header from './Header';
import { useOrchardLayout } from './orchard/OrchardProvider';
import { GLASS, panelStyle } from './Panel';

// 로그인·가입 화면: 헤더에 브랜드만, 최대 폭 420px 패널을 가운데 (spec 3.3)
const MAX_WIDTH = 420;
const TOP = 24;

export default function AuthShell({ children }: PropsWithChildren) {
  useOrchardLayout('auth');
  return (
    // .o-zoom: 큰 화면에서 화면 배율을 키운다(spec 3.2, app/orchard.css)
    <div className="o-zoom">
      <Header userName={null} />
      <Box as="main" sx={[containerStyle(), { paddingTop: TOP, paddingBottom: 96, '@media (max-width: 767px)': { paddingTop: 16 } }]}>
        <Box as="section" {...GLASS} sx={[panelStyle, { maxWidth: MAX_WIDTH, margin: '0 auto' }]}>{children}</Box>
      </Box>
    </div>
  );
}
