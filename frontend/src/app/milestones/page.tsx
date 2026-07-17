import MilestonesClient from '@/app/milestones/_components/MilestonesClient';
import { ParsedToken } from '@/lib/account/parsed-token';

export default async function MilestonesHome() {
  const parsed = await ParsedToken.createFromCookie();
  const username = parsed.name();
  const userId = parsed.userId();
  const account =
    parsed.success() && username && userId ? { username, userId } : null;
  const automaticSyncEnabled = process.env.MILESTONES_AUTO_SYNC === '1';
  return (
    <MilestonesClient
      account={account}
      automaticSyncEnabled={automaticSyncEnabled}
    />
  );
}
