import GardenView from '@/components/GardenView';
import { getSessionUserId, listAllAttendance, listProfiles } from '@/lib/data';
import { serverToday } from '@/lib/time';
import { gardenView } from '@/lib/view';
import { PAGE_TITLES } from '@/lib/copy';

export const metadata = { title: PAGE_TITLES.garden };

export default async function GardenPage() {
  const [me, profiles, all] = await Promise.all([getSessionUserId(), listProfiles(), listAllAttendance()]);
  return <GardenView view={gardenView(me!, profiles, all, serverToday())} />;
}
