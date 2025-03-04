import { ParsedToken } from '@/lib/account/parsed-token';
import EmojifyMain from '@/app/emojify/_components/EmojifyMain';
import { NEW_USER_ROLE } from '@/lib/consts/auth';

export default function EmojifyPage() {
  const parsed = ParsedToken.createFromCookie();
  return (
    <EmojifyMain
      username={parsed.name()}
      showAi={parsed.role() !== '' && parsed.role() !== NEW_USER_ROLE}
    />
  );
}
