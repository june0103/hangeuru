import { redirect } from 'next/navigation';

import FruitScreen from '@/components/onboarding/FruitScreen';
import { PAGE_TITLES } from '@/lib/copy';
import { getProfile, getSessionUserId, listAttendanceOf } from '@/lib/data';
import { FRUIT_DAYS } from '@/lib/rules';
import { serverToday } from '@/lib/time';
import { statsOf } from '@/lib/view';

export const metadata = { title: PAGE_TITLES.fruit };

// 20일을 채운 날 보는 열매 화면. 20일이 안 됐으면 홈으로(spec 3.1)
export default async function FruitPage() {
  const id = await getSessionUserId();
  const me = id ? await getProfile(id) : null;
  if (!me) redirect(id ? '/auth/signout' : '/login');
  if (!me.seed) redirect('/seeds');
  const st = statsOf(me, await listAttendanceOf(me.id), serverToday());
  if (st.days < FRUIT_DAYS) redirect('/');
  return <FruitScreen seed={me.seed} name={me.name} />;
}
