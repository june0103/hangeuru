import SignupForm from '@/components/SignupForm';
import { SEASON } from '@/lib/rules';
import { serverToday } from '@/lib/time';
import { PAGE_TITLES } from '@/lib/copy';

export const metadata = { title: PAGE_TITLES.signup };

export default function SignupPage() {
  return <SignupForm closed={serverToday() > SEASON.end} />;
}
