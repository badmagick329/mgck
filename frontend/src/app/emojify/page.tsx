import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import EmojifyClientPage from '@/app/emojify/_components/EmojifyClientPage';
import { CorruptText, CorruptTextSegments } from '@/lib/emojify/corrupt-text';
import { randomBetween } from '@/lib/utils';
import { canUseAiEmojis } from '@/lib/account/permissions';
import { randomMessage, randomUserMessage } from '@/lib/emojify';

export default async function EmojifyPage() {
  const session = await getVerifiedCoreSession();
  const message = session?.username
    ? randomUserMessage(session.username)
    : randomMessage();
  const numberOfCorruptions = randomBetween(1, 3);
  const corruptText = CorruptText.createFrom(message, numberOfCorruptions);
  const segments = new CorruptTextSegments(corruptText);
  const headerTypingSequence = segments.createTypingSequence(100);

  return (
    <EmojifyClientPage
      username={session?.username || ''}
      showAi={canUseAiEmojis(session)}
      headerTypingSequence={headerTypingSequence}
    />
  );
}
