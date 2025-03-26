import { ParsedToken } from '@/lib/account/parsed-token';
import EmojifyClientPage from '@/app/emojify/_components/EmojifyClientPage';
import { CorruptText, CorruptTextSegments } from '@/lib/emojify/corrupt-text';
import { randomBetween } from '@/lib/utils';
import { canUseAiEmojis } from '@/lib/account/permissions';
import { randomMessage, randomUserMessage } from '@/lib/emojify';

export default async function EmojifyPage() {
  const parsed = await ParsedToken.createFromCookie();
  const message = parsed.name()
    ? randomUserMessage(parsed.name())
    : randomMessage();
  const numberOfCorruptions = randomBetween(0, 2);
  const corruptText = CorruptText.createFrom(message, numberOfCorruptions);
  const segments = new CorruptTextSegments(corruptText);
  const headerTypingSequence = segments.createTypingSequence(100);

  return (
    <EmojifyClientPage
      username={parsed.name()}
      showAi={canUseAiEmojis(parsed)}
      headerTypingSequence={headerTypingSequence}
    />
  );
}
