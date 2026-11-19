import { redirect } from 'next/navigation';

import SeedsScreen from '@/components/onboarding/SeedsScreen';
import { PAGE_TITLES } from '@/lib/copy';
import { getProfile, getSessionUserId } from '@/lib/data';

export const metadata = { title: PAGE_TITLES.seeds };

// 씨앗 고르기. 가입한 뒤(또는 씨앗 없이 로그인한 뒤) 한 번만 거친다(spec 3.1)
export default async function SeedsPage() {
  const id = await getSessionUserId();
  const me = id ? await getProfile(id) : null;
  if (!me) redirect(id ? '/auth/signout' : '/login');
  if (me.seed) redirect('/');
  return <SeedsScreen />;
}
