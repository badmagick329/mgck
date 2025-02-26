import { ParsedToken } from '@/lib/account/parsed-token';
import EmojifyMain from '@/app/emojify/_components/EmojifyMain';

export default function EmojifyPage() {
  const parsed = ParsedToken.createFromCookie();
  return <EmojifyMain username={parsed.name()} role={parsed.role()} />;
}
