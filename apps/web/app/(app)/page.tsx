import HomeView from '@/components/HomeView';
import { PAGE_TITLES, SIGNUP } from '@/lib/copy';
import { getSessionUserId, getProfile, listAttendanceOf, listAttendanceOn, listProfiles } from '@/lib/data';
import { attendanceTotals } from '@/lib/rules';
import { serverNow, serverToday } from '@/lib/time';
import type { Member } from '@/lib/types';
import { badgesView, campView, cardModel, statsOf, todayView, treeView, weekView } from '@/lib/view';

import { checkIn, checkOut, harvest } from '../actions';

export const metadata = { title: PAGE_TITLES.home };

export default async function HomePage({ searchParams }: PageProps<'/'>) {
  // 씨앗이 없는 사람은 레이아웃이 씨앗 고르기로 보낸다
  const me = (await getProfile((await getSessionUserId())!)) as Member;
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
      attendanceTime={attendanceTotals(records, today, serverNow()).total}
      camp={campView(today, todays, profiles)}
      card={cardModel(me, records, today)}
      badges={badgesView(me, st, today)}
      welcome={welcome}
      actions={{ checkIn, checkOut, harvest }}
    />
  );
}
