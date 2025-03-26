import { ParsedToken } from '@/lib/account/parsed-token';
import ShortenClientPage from './_components/ShortenClientPage';
import { canUseShortener } from '@/lib/account/permissions';
import { redirect } from 'next/navigation';

export default async function UrlShortenerPage() {
  const token = await ParsedToken.createFromCookie();
  if (canUseShortener(token)) {
    return <ShortenClientPage username={token.name()} />;
  }
  redirect('/account');
}
