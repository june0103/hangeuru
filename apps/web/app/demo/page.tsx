import HomeView from '@/components/HomeView';
import { DEMO, PAGE_TITLES } from '@/lib/copy';
import { DEMO_TODAY, portfolioDemo } from '@/lib/portfolio-demo';
import { badgesView, campView, statsOf, todayView, treeView, weekView } from '@/lib/view';

export const metadata = { title: PAGE_TITLES.home };

export default function DemoHomePage() {
  const { me, profiles, attendance, records, totals } = portfolioDemo();
  const stats = statsOf(me, records, DEMO_TODAY);
  const todays = attendance.filter(record => record.workDate === DEMO_TODAY);
  const todayRecord = todays.find(record => record.userId === me.id) ?? null;
  const today = todayView(me, todayRecord, DEMO_TODAY);

  return (
    <HomeView
      today={{ ...today, button: { ...today.button, action: null }, hint: DEMO.attendanceHint }}
      week={weekView(me, stats, DEMO_TODAY)}
      tree={treeView(me, stats, !!todayRecord, DEMO_TODAY)}
      attendanceTime={totals.total}
      camp={campView(DEMO_TODAY, todays, profiles)}
      card={null}
      badges={badgesView(me, stats, DEMO_TODAY)}
      welcome={null}
    />
  );
}
