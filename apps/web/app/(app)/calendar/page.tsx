import CalendarView from '@/components/CalendarView';
import { getSessionUserId, listAttendanceOf } from '@/lib/data';
import { attendanceTotals } from '@/lib/rules';
import { serverNow, serverToday } from '@/lib/time';
import { CALENDAR_MONTHS, initialMonth, monthView } from '@/lib/view';
import { PAGE_TITLES } from '@/lib/copy';

export const metadata = { title: PAGE_TITLES.calendar };

export default async function CalendarPage() {
  const records = await listAttendanceOf((await getSessionUserId())!);
  const today = serverToday();
  const { byDate, total } = attendanceTotals(records, today, serverNow());
  const months = CALENDAR_MONTHS.map(ym => monthView(ym, records, today, byDate));
  return (
    <CalendarView
      months={months}
      initial={months.findIndex(month => month.ym === initialMonth(today))}
      today={today}
      attendance={total}
    />
  );
}
