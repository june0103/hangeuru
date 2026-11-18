import HomeView from '@/components/HomeView';
import { PAGE_TITLES, SIGNUP } from '@/lib/copy';
import { getSessionUserId, getProfile, listAttendanceOf, listAttendanceOn, listProfiles } from '@/lib/data';
import { serverToday } from '@/lib/time';
import { campView, cardModel, statsOf, todayView, treeView, weekView } from '@/lib/view';

export const metadata = { title: PAGE_TITLES.home };

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  const me = (await getProfile((await getSessionUserId())!))!;
  const today = serverToday();
  const [records, todays, profiles] = await Promise.all([listAttendanceOf(me.id), listAttendanceOn(today), listProfiles()]);
  const st = statsOf(me, records, today);
  const todayRecord = records.find(r => r.workDate === today) ?? null;
  const welcome = (await searchParams).welcome === '1' ? SIGNUP.welcome(me.name, me.seed) : null;
  return (
    <HomeView
      today={todayView(me, todayRecord, today)}
      week={weekView(me, st, today)}
      tree={treeView(me, st, !!todayRecord, today)}
      camp={campView(today, todays, profiles)}
      card={cardModel(me, records, today)}
      welcome={welcome}
    />
  );
}
