import { getVerifiedCoreSession } from '@/lib/account/verified-session';
import ShortenClientPage from './_components/ShortenClientPage';
import { canUseShortener } from '@/lib/account/permissions';
import { redirect } from 'next/navigation';
import { getAllShortenedUrls } from '@/actions/urlshortener';

export default async function UrlShortenerPage() {
  const session = await getVerifiedCoreSession();
  if (!canUseShortener(session)) {
    redirect('/account');
  }
  const response = await getAllShortenedUrls();
  return <ShortenClientPage shortenedUrls={response.urls || null} />;
}
