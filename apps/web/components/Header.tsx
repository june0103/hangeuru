'use client';

import { Box, Button, FlexBox, Tab, TabList, TabListItem, TextButton, addOpacity, containerStyle } from '@montage-ui/core';
import type { Theme } from '@montage-ui/core';
import { IconPerson } from '@montage-ui/icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { HEADER, NAV } from '@/lib/copy';

import BrandMark from './BrandMark';

const MIN_HEIGHT = 56;
const TAB_GAP = 32;
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
  onSignOut?: () => void;
  signingOut?: boolean;
};

export default function Header({ userName, onOpenSettings, onSignOut, signingOut }: Props) {
  const pathname = usePathname();
  return (
    <Box
      as="header"
      sx={(theme: Theme) => ({
        position: 'sticky',
        top: 0,
        zIndex: 10,
        paddingTop: 'env(safe-area-inset-top, 0px)',
        backgroundColor: addOpacity(theme.semantic.background.neutral.primary, theme.opacity[88]),
        backdropFilter: 'blur(32px)',
        WebkitBackdropFilter: 'blur(32px)',
        borderBottom: `1px solid ${theme.semantic.line.neutral.tertiary}`,
      })}
    >
      <FlexBox alignItems="stretch" sx={[containerStyle(), { minHeight: MIN_HEIGHT }]}>
        <FlexBox alignItems="center">
          <BrandMark href={userName ? '/' : '/login'} />
        </FlexBox>
        {userName && (
          <>
            <Box sx={{ display: 'none', marginLeft: TAB_GAP, alignSelf: 'flex-end', '@media (min-width: 768px)': { display: 'block' } }}>
              <Tab value={navKey(pathname)}>
                <TabList size="small" aria-label={NAV.ariaLabel}>
                  {NAV_ITEMS.map(item => (
                    <TabListItem key={item.key} as={Link} href={item.href} value={item.key}>{item.label}</TabListItem>
                  ))}
                </TabList>
              </Tab>
            </Box>
            <FlexBox alignItems="center" gap={USER_GAP} sx={{ marginLeft: 'auto' }}>
              <TextButton
                size="small"
                color="assistive"
                aria-label={HEADER.openSettings}
                leadingContent={<IconPerson width={ICON} height={ICON} />}
                onClick={onOpenSettings}
              >
                {HEADER.userName(userName)}
              </TextButton>
              <Button variant="outlined" color="assistive" size="small" onClick={onSignOut} loading={signingOut}>
                {HEADER.signOut}
              </Button>
            </FlexBox>
          </>
        )}
      </FlexBox>
    </Box>
  );
}
