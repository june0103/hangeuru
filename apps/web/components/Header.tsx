'use client';

import { Box, FlexBox, IconButton, Tab, TabList, TabListItem, TextButton, containerStyle } from '@montage-ui/core';
import { IconPerson } from '@montage-ui/icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HEADER, NAV } from '@/lib/copy';

import BrandMark from './BrandMark';
import ThemeControl from './ThemeControl';

const MIN_HEIGHT = 56;
const USER_GAP = 12;
const ICON = 18;

export const NAV_ITEMS = [
  { href: '/', key: 'home', label: NAV.home },
  { href: '/calendar', key: 'calendar', label: NAV.calendar },
  { href: '/garden', key: 'garden', label: NAV.garden },
] as const;

export const navKey = (pathname: string) =>
  pathname.startsWith('/calendar') ? 'calendar' : pathname.startsWith('/garden') ? 'garden' : 'home';

type Props = {
  /** 로그인한 화면이면 이름. 로그인·가입 화면에서는 null */
  userName: string | null;
  onOpenSettings?: () => void;
};

// 헤더(spec 3.2): 색 띠 없이 배경에 녹는다. 768px 이상은 로고 왼쪽, 탭 셋 가운데, 테마 전환과 이름 오른쪽.
// 로그아웃은 내 설정 창에 있다(3.8). 바탕과 자리 잡기는 app/orchard.css 의 body > header, [data-orchard-head]
export default function Header({ userName, onOpenSettings }: Props) {
  const pathname = usePathname();
  return (
    <Box as="header" sx={{ position: 'sticky', top: 0, zIndex: 10, paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <FlexBox alignItems="stretch" data-orchard-head={userName ? 'bar' : undefined} sx={[containerStyle(), { minHeight: MIN_HEIGHT }]}>
        <FlexBox alignItems="center">
          <BrandMark href={userName ? '/' : '/login'} />
        </FlexBox>
        {userName && (
          <>
            <Box data-orchard-head="tabs" sx={{ display: 'none', alignSelf: 'flex-end', '@media (min-width: 768px)': { display: 'block' } }}>
              <Tab value={navKey(pathname)}>
                <TabList size="small" aria-label={NAV.ariaLabel}>
                  {NAV_ITEMS.map(item => (
                    <TabListItem key={item.key} as={Link} href={item.href} value={item.key}>{item.label}</TabListItem>
                  ))}
                </TabList>
              </Tab>
            </Box>
            <FlexBox data-orchard-head="user" alignItems="center" gap={USER_GAP} sx={{ marginLeft: 'auto' }}>
              <ThemeControl />
              {/* 768px 미만은 이름이 길면 브랜드와 겹쳐서 아이콘 버튼만 둔다 (spec 3.2) */}
              <Box sx={{ display: 'none', '@media (min-width: 768px)': { display: 'block' } }}>
                <TextButton
                  size="small"
                  color="assistive"
                  aria-label={HEADER.openSettings}
                  leadingContent={<IconPerson width={ICON} height={ICON} />}
                  onClick={onOpenSettings}
                >
                  {HEADER.userName(userName)}
                </TextButton>
              </Box>
              <Box sx={{ '@media (min-width: 768px)': { display: 'none' } }}>
                <IconButton size={44} aria-label={HEADER.openSettings} color="semantic.foreground.neutral.secondary" onClick={onOpenSettings}>
                  <IconPerson />
                </IconButton>
              </Box>
            </FlexBox>
          </>
        )}
      </FlexBox>
    </Box>
  );
}
