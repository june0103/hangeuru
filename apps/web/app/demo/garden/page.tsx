import GardenView from '@/components/GardenView';
import { PAGE_TITLES } from '@/lib/copy';
import { DEMO_TODAY, portfolioDemo } from '@/lib/portfolio-demo';
import { gardenView } from '@/lib/view';

export const metadata = { title: PAGE_TITLES.garden };

export default function DemoGardenPage() {
  const { me, profiles, attendance } = portfolioDemo();
  return <GardenView view={gardenView(me.id, profiles, attendance, DEMO_TODAY)} />;
}
