import LoginForm from '@/components/LoginForm';
import { PAGE_TITLES } from '@/lib/copy';

export const metadata = { title: PAGE_TITLES.login };

export default function LoginPage() {
  return <LoginForm />;
}
