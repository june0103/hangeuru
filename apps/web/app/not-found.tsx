import MessageScreen from '@/components/MessageScreen';
import { NOT_FOUND } from '@/lib/copy';

export default function NotFound() {
  return <MessageScreen title={NOT_FOUND.title} action={{ label: NOT_FOUND.home, href: '/' }} />;
}
