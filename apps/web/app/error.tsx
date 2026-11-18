'use client';

import MessageScreen from '@/components/MessageScreen';
import { ERROR_PAGE } from '@/lib/copy';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <MessageScreen title={ERROR_PAGE.title} desc={ERROR_PAGE.desc} action={{ label: ERROR_PAGE.retry, onClick: reset }} />;
}
