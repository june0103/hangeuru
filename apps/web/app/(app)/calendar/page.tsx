import CalendarView from '@/components/CalendarView';
import { getSessionUserId, listAttendanceOf } from '@/lib/data';
import { serverToday } from '@/lib/time';
import { CALENDAR_MONTHS, initialMonth, monthView } from '@/lib/view';
import { PAGE_TITLES } from '@/lib/copy';

export const metadata = { title: PAGE_TITLES.calendar };

export default async function CalendarPage() {
  const records = await listAttendanceOf((await getSessionUserId())!);
  const today = serverToday();
  const months = CALENDAR_MONTHS.map(ym => monthView(ym, records, today));
  return <CalendarView months={months} initial={CALENDAR_MONTHS.indexOf(initialMonth(today) as (typeof CALENDAR_MONTHS)[number])} />;
}
