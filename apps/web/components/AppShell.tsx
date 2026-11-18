'use client';

import { Box, Global, containerStyle } from '@montage-ui/core';
import { usePathname } from 'next/navigation';
import { type PropsWithChildren, useState, useTransition } from 'react';

import { signOut } from '@/app/actions';
import type { Profile } from '@/lib/types';

import BottomNav from './BottomNav';
import Header from './Header';
import SettingsModal from './SettingsModal';

// 본문 여백과 토스트 위치 (spec 3.2, 3.10)
const PAD_TOP = 24;
const PAD_TOP_M = 16;
const PAD_BOTTOM = 96;
const PAD_BOTTOM_M = 88;
const PAD_BOTTOM_M_HOME = 164;
// 몽타주 토스트 영역이 모바일에서 아래 20px를 더하므로 72px, 148px에서 20을 뺀다
const TOAST_M = '52px';
const TOAST_M_HOME = '128px';

type Me = Pick<Profile, 'name' | 'seed' | 'plan'> & { harvested: boolean };

export default function AppShell({ me, children }: PropsWithChildren<{ me: Me }>) {
  const home = usePathname() === '/';
  const [settings, setSettings] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  return (
    <>
      <Global styles={{ '@media (max-width: 767px)': { ':root': { '--app-toast-offset': home ? TOAST_M_HOME : TOAST_M } } }} />
      <Header
        userName={me.name}
        onOpenSettings={() => setSettings(true)}
        onSignOut={() => startSignOut(() => signOut())}
        signingOut={signingOut}
      />
      <Box
        as="main"
        sx={[
          containerStyle(),
          {
            paddingTop: PAD_TOP,
            paddingBottom: PAD_BOTTOM,
            '@media (max-width: 767px)': {
              paddingTop: PAD_TOP_M,
              paddingBottom: `calc(${home ? PAD_BOTTOM_M_HOME : PAD_BOTTOM_M}px + env(safe-area-inset-bottom, 0px))`,
            },
          },
        ]}
      >
        {children}
      </Box>
      <BottomNav />
      <SettingsModal open={settings} onOpenChange={setSettings} me={me} />
    </>
  );
}
