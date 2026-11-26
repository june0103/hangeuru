import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import AppShell from '@/components/AppShell';
import { getProfile, getSessionUserId } from '@/lib/data';

import { signOut, updateProfile } from '../actions';

// 로그인한 구성원만 들어온다. profiles 행이 없으면 로그인 화면으로 (spec 8.4)
export default async function AppLayout({ children }: PropsWithChildren) {
  const id = await getSessionUserId();
  const me = id ? await getProfile(id) : null;
  if (!me) redirect(id ? '/auth/signout' : '/login');
  // 씨앗을 아직 심지 않았으면 씨앗 고르기부터(spec 3.1)
  if (!me.seed) redirect('/seeds');
  return (
    <AppShell account={{
      me: { name: me.name, seed: me.seed, plan: me.plan, harvested: !!me.harvestedAt },
      signOut,
      updateProfile,
    }}>
      {children}
    </AppShell>
  );
}
