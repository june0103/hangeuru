import SplashScreen from '@/components/onboarding/SplashScreen';
import { PAGE_TITLES } from '@/lib/copy';

export const metadata = { title: PAGE_TITLES.start };

export default function DemoStartPage() {
  return <SplashScreen startHref="/demo" loginHref="/demo/login" />;
}
