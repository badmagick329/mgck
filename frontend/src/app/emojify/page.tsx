import { ParsedToken } from '@/lib/account/parsed-token';
import EmojifyClientPage from '@/app/emojify/_components/EmojifyClientPage';
import { NEW_USER_ROLE } from '@/lib/consts/auth';

export default function EmojifyPage() {
  const parsed = ParsedToken.createFromCookie();
  return (
    <EmojifyClientPage
      username={parsed.name()}
      showAi={parsed.role() !== '' && parsed.role() !== NEW_USER_ROLE}
    />
  );
}
