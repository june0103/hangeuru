import SplashScreen from '@/components/onboarding/SplashScreen';
import { PAGE_TITLES } from '@/lib/copy';

export const metadata = { title: PAGE_TITLES.start };

// 처음 온 사람이 보는 스플래시. 로그인한 적이 있는 브라우저와 로그인한 사람은 proxy가 다른 곳으로 보낸다(spec 3.1, 8.4)
export default function StartPage() {
  return <SplashScreen />;
}
