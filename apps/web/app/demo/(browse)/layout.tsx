import type { PropsWithChildren } from 'react';

import AppShell from '@/components/AppShell';

export default function DemoBrowseLayout({ children }: PropsWithChildren) {
  return <AppShell>{children}</AppShell>;
}
