import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import AuthShell from '@/components/AuthShell';
import { getSessionUserId } from '@/lib/data';

// 로그인한 채 오면 홈으로 (spec 3.1)
export default async function AuthLayout({ children }: PropsWithChildren) {
  if (await getSessionUserId()) redirect('/');
  return <AuthShell>{children}</AuthShell>;
}
