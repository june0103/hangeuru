import 'server-only';

import { DEMO } from './copy';
import { createFixtures } from './fixtures';
import { attendanceTotals } from './rules';
import { isMember } from './view';

export const DEMO_TODAY = '2026-12-17';
const DEMO_NOW = `${DEMO_TODAY}T18:30:00+09:00`;

export function portfolioDemo() {
  const fixtures = createFixtures();
  const profiles = fixtures.profiles.filter(isMember).map((profile, index) => ({
    ...profile,
    name: DEMO.memberName(index),
    harvestedAt: profile.harvestedAt && Date.parse(profile.harvestedAt) <= Date.parse(DEMO_NOW)
      ? profile.harvestedAt : null,
  }));
  const [me] = profiles;
  const attendance = fixtures.attendance.filter(record =>
    record.workDate <= DEMO_TODAY && (!record.checkInAt || Date.parse(record.checkInAt) <= Date.parse(DEMO_NOW)),
  ).map(record => ({
    ...record,
    checkOutAt: record.checkOutAt && Date.parse(record.checkOutAt) <= Date.parse(DEMO_NOW) ? record.checkOutAt : null,
  }));
  const records = attendance.filter(record => record.userId === me.id);
  const totals = attendanceTotals(records, DEMO_TODAY, DEMO_NOW);
  return { me, profiles, attendance, records, totals };
}
