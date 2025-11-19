import { ParsedToken } from '@/lib/account/parsed-token';
import ShortenClientPage from './_components/ShortenClientPage';
import { canUseShortener } from '@/lib/account/permissions';
import { redirect } from 'next/navigation';
import { getAllShortenedUrls } from '@/actions/urlshortener';

export default async function UrlShortenerPage() {
  const token = await ParsedToken.createFromCookie();
  if (!canUseShortener(token)) {
    redirect('/account');
  }
  const response = await getAllShortenedUrls();
  return <ShortenClientPage shortenedUrls={response.urls || null} />;
}
