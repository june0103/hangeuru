'use client';

import { Box, Global, containerStyle } from '@montage-ui/core';
import { type PropsWithChildren, useState, useTransition } from 'react';

import { signOut } from '@/app/actions';
import type { Member } from '@/lib/types';

import BottomNav from './BottomNav';
import Header from './Header';
import { useOrchardLayout } from './orchard/OrchardProvider';
import SettingsModal from './SettingsModal';

// 본문 여백과 토스트 위치 (spec 3.2, 3.10)
const PAD_TOP = 24;
const PAD_TOP_M = 16;
const PAD_BOTTOM = 96;
const PAD_BOTTOM_M = 88;
// 몽타주 토스트 영역이 모바일에서 아래 20px를 더하므로 72px, 148px에서 20을 뺀다
const TOAST_M = '52px';

type Me = Pick<Member, 'name' | 'seed' | 'plan'> & { harvested: boolean };

export default function AppShell({ me, children }: PropsWithChildren<{ me: Me }>) {
  const [settings, setSettings] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  useOrchardLayout('app');
  return (
    <>
      <Global styles={{ '@media (max-width: 767px)': { ':root': { '--app-toast-offset': TOAST_M } } }} />
      <Header userName={me.name} onOpenSettings={() => setSettings(true)} />
      <Box
        as="main"
        sx={[
          containerStyle(),
          {
            paddingTop: PAD_TOP,
            paddingBottom: PAD_BOTTOM,
            '@media (max-width: 767px)': {
              paddingTop: PAD_TOP_M,
              paddingBottom: `calc(${PAD_BOTTOM_M}px + env(safe-area-inset-bottom, 0px))`,
            },
          },
        ]}
      >
        {children}
      </Box>
      <BottomNav />
      <SettingsModal open={settings} onOpenChange={setSettings} me={me} onSignOut={() => startSignOut(() => signOut())} signingOut={signingOut} />
    </>
  );
}
