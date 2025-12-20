import MilestonesClient from '@/app/milestones/_components/MilestonesClient';
import { ParsedToken } from '@/lib/account/parsed-token';

export default async function MilestonesHome() {
  const parsed = await ParsedToken.createFromCookie();
  const username = parsed.name();
  return <MilestonesClient username={username} />;
}
