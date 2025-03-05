import { ParsedToken } from '@/lib/account/parsed-token';
import EmojifyClientPage from '@/app/emojify/_components/EmojifyClientPage';
import { NEW_USER_ROLE } from '@/lib/consts/auth';
import { randomChoice } from '@/lib/utils';

const loaderEmojis = [
  '😃',
  '🥰',
  '😍',
  '🤓',
  '🤯',
  '😯',
  '🫣',
  '😳',
  '👀',
  '🤪',
  '😎',
  '😏',
  '🤠',
  '😇',
];
export default function EmojifyPage() {
  const parsed = ParsedToken.createFromCookie();
  const randomEmoji = randomChoice(loaderEmojis);
  return (
    <EmojifyClientPage
      username={parsed.name()}
      showAi={parsed.role() !== '' && parsed.role() !== NEW_USER_ROLE}
      loaderEmoji={randomEmoji}
    />
  );
}
