import AuthShell from '@/components/AuthShell';
import { PAGE_TITLES } from '@/lib/copy';

import DemoLogin from './DemoLogin';

export const metadata = { title: PAGE_TITLES.login };

export default function DemoLoginPage() {
  return (
    <AuthShell brandHref="/demo">
      <DemoLogin />
    </AuthShell>
  );
}
