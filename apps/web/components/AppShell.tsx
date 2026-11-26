'use client';

import { Box, Global, containerStyle } from '@montage-ui/core';
import { usePathname } from 'next/navigation';
import { type PropsWithChildren, useEffect, useRef, useState, useTransition } from 'react';

import type { signOut, updateProfile } from '@/app/actions';
import type { Member } from '@/lib/types';

import BottomNav from './BottomNav';
import Header from './Header';
import { useOrchardLayout } from './orchard/OrchardProvider';
import SettingsModal from './SettingsModal';

// 본문 여백과 토스트 위치 (spec 3.2, 3.10)
const PAD_TOP = 24;
const PAD_TOP_M = 16;
const PAD_BOTTOM = 96;
// 768px 미만은 본문이 하단 탭 바 위의 스크롤 영역(.o-scroll, app/orchard.css) 안에 있다
const PAD_BOTTOM_M = 24;
// 몽타주 토스트 영역이 모바일에서 아래 20px를 더하므로 72px, 148px에서 20을 뺀다
const TOAST_M = '52px';

type Me = Pick<Member, 'name' | 'seed' | 'plan'> & { harvested: boolean };
type Account = { me: Me; signOut: typeof signOut; updateProfile: typeof updateProfile };

export default function AppShell({ account, children }: PropsWithChildren<{ account?: Account }>) {
  const [settings, setSettings] = useState(false);
  const [signingOut, startSignOut] = useTransition();
  useOrchardLayout('app');
  // 768px 미만에서는 화면 대신 스크롤 영역이 스크롤되므로, 화면을 옮기면 맨 위로 올린다
  const scroller = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  useEffect(() => { scroller.current?.scrollTo(0, 0); }, [pathname]);
  return (
    <>
      <Global styles={{ '@media (max-width: 767px)': { ':root': { '--app-toast-offset': TOAST_M } } }} />
      {/* 768px 미만: 헤더와 본문은 하단 탭 바 위에서만 스크롤된다(spec 3.10) */}
      <div className="o-scroll o-zoom" ref={scroller}>
      <Header userName={account?.me.name ?? null} demo={!account} onOpenSettings={account && (() => setSettings(true))} />
      <Box
        as="main"
        sx={[
          containerStyle(),
          {
            paddingTop: PAD_TOP,
            paddingBottom: PAD_BOTTOM,
            '@media (max-width: 767px)': {
              paddingTop: PAD_TOP_M,
              paddingBottom: PAD_BOTTOM_M,
            },
          },
        ]}
      >
        {children}
      </Box>
      </div>
      <BottomNav demo={!account} />
      {account && (
        <SettingsModal open={settings} onOpenChange={setSettings} me={account.me} updateProfileAction={account.updateProfile}
          onSignOut={() => startSignOut(() => account.signOut())} signingOut={signingOut} />
      )}
    </>
  );
}
