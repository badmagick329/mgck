import MilestonesClient from '@/app/milestones/_components/MilestonesClient';
import { getVerifiedCoreSession } from '@/lib/account/verified-session';

export default async function MilestonesHome() {
  const session = await getVerifiedCoreSession();
  const account = session
    ? { username: session.username, userId: session.userId }
    : null;
  const automaticSyncEnabled = process.env.MILESTONES_AUTO_SYNC === '1';
  return (
    <MilestonesClient
      account={account}
      automaticSyncEnabled={automaticSyncEnabled}
    />
  );
}
