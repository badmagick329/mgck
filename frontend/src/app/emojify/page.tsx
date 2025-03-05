import { ParsedToken } from '@/lib/account/parsed-token';
import EmojifyClientPage from '@/app/emojify/_components/EmojifyClientPage';
import { NEW_USER_ROLE } from '@/lib/consts/auth';
import { CorruptText, CorruptTextSegments } from '@/lib/emojify/corrupt-text';
import { randomBetween, randomChoice } from '@/lib/utils';

export default function EmojifyPage() {
  const parsed = ParsedToken.createFromCookie();
  const plainMessage = parsed.name()
    ? `Hello ${parsed.name()} !`
    : 'Emojify Your Message';

  const message = parsed.name()
    ? randomUserMessage(parsed.name())
    : randomMessage();
  const numberOfCorruptions = randomBetween(2, 4);
  const corruptText = CorruptText.createFrom(message, numberOfCorruptions);
  const segments = new CorruptTextSegments(corruptText);
  const headerTypingSequence = segments.createTypingSequence(100);

  return (
    <EmojifyClientPage
      username={parsed.name()}
      showAi={parsed.role() !== '' && parsed.role() !== NEW_USER_ROLE}
      headerTypingSequence={headerTypingSequence}
    />
  );
}

const randomUserMessage = (username: string) => {
  return randomChoice([
    `Yo ${username}, time to ⚡️ level up your text game 🚀.`,
    `Hey ${username}, let's give your words a glow-up — it's gonna be lit 🔥.`,
    `Yo ${username}, spice up your message with a dash of 💥 emoji magic.`,
    `Sup ${username}? Let's add some edge to your message, no cap 😎.`,
    `Hey ${username}, get ready to flex some emojis 🤙.`,
    `Yo ${username}, time to upgrade your text with a fresh emoji twist 🤯.`,
    `Hey ${username}, let's roll out some emojis for that extra punch 💥.`,
    `What's up, ${username}? Your message is about to get a boost 🚀.`,
    `Hey ${username}, ready to make your text pop? Let's add some 🎉 flair.`,
    `Yo ${username}, add some vibe to your words with a few emojis 🤙.`,
    `Hey ${username}, let's inject some emoji life into your text — time to shine ✨.`,
    `Sup ${username}? Your message's about to get an upgrade — fresh vibes only ⚡️.`,
    `Yo ${username}, time to give your words that extra spark — light it up 🔥.`,
  ]);
};

const randomMessage = () => {
  return randomChoice([
    `Time to emojify your message — bring in that ⚡️ energy.`,
    `Let's turn your text into something epic, sprinkled with some 💥 magic.`,
    `Add a dash of emoji vibe to your words — sprinkle in some ✨ flair.`,
    `Let your text flex with a hint of emojis 😎 — it's all about the vibe.`,
    `Let's give your message a quick glow-up — watch it light up 🔥.`,
    `Upgrade your text game with a splash of emoji, because 🤩 is the new cool.`,
    `Add a little emoji flair to your text — mix in some 🎉 vibes.`,
    `Get those emojis in and let your message shine, pure ✨ brilliance.`,
    `Your text called — it wants a cool emoji upgrade, serve it some 😎 flair.`,
    `Level up your message with a touch of emoji magic — get those 🤙 vibes.`,
    `A quick emoji twist can change the vibe — a sprinkle of 🎉 magic.`,
    `Emojify your text — keep it fresh, keep it real 🤘.`,
  ]);
};
