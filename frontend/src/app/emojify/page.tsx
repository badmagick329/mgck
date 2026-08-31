import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import EmojifyClientPage from '@/app/emojify/_components/EmojifyClientPage';
import { canUseAiEmojis } from '@/lib/account/permissions';

export default async function EmojifyPage() {
  const session = await getVerifiedCoreSession();

  return (
    <EmojifyClientPage
      username={session?.username || ''}
      showAi={canUseAiEmojis(session)}
    />
  );
}
