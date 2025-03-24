import { ParsedToken } from '@/lib/account/parsed-token';
import ShortenClientPage from './_components/ShortenClientPage';
import { canUseShortener } from '@/lib/account/permissions';
import { redirect } from 'next/navigation';

export default function UrlShortenerPage() {
  const token = ParsedToken.createFromCookie();
  if (canUseShortener(token)) {
    return <ShortenClientPage />;
  }
  redirect('/account');
}
