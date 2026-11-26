import CalendarView from '@/components/CalendarView';
import { PAGE_TITLES } from '@/lib/copy';
import { DEMO_TODAY, portfolioDemo } from '@/lib/portfolio-demo';
import { CALENDAR_MONTHS, initialMonth, monthView } from '@/lib/view';

export const metadata = { title: PAGE_TITLES.calendar };

export default function DemoCalendarPage() {
  const { records, totals } = portfolioDemo();
  const months = CALENDAR_MONTHS.map(ym => monthView(ym, records, DEMO_TODAY, totals.byDate));
  return (
    <CalendarView
      months={months}
      initial={months.findIndex(month => month.ym === initialMonth(DEMO_TODAY))}
      today={DEMO_TODAY}
      attendance={totals.total}
    />
  );
}
