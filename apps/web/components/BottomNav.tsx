'use client';

import { BottomNavigation, BottomNavigationItem, Box } from '@montage-ui/core';
import { IconCalendar, IconHome, IconPersons } from '@montage-ui/icon';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { NAV } from '@/lib/copy';

import { navKey } from './Header';

// 768px 미만에서만 보이는 하단 탭 바 (spec 3.2, 3.10)
const ITEMS = [
  { href: '/', key: 'home', label: NAV.home, icon: <IconHome /> },
  { href: '/calendar', key: 'calendar', label: NAV.calendar, icon: <IconCalendar /> },
  { href: '/garden', key: 'garden', label: NAV.gardenShort, icon: <IconPersons /> },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <Box
      as="nav"
      aria-label={NAV.ariaLabel}
      sx={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 10,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        '@media (min-width: 768px)': { display: 'none' },
      }}
    >
      <BottomNavigation value={navKey(pathname)}>
        {ITEMS.map(item => (
          <BottomNavigationItem key={item.key} as={Link} href={item.href} value={item.key} label={item.label} icon={item.icon} />
        ))}
      </BottomNavigation>
    </Box>
  );
}
