import { fetchShortenedUrl } from '@/actions/urlshortener';
import { notFound, redirect } from 'next/navigation';

export default async function ShortCodePage({
  params,
}: {
  params: { segments: string[] };
}) {
  const { segments } = params;
  if (segments.length !== 1) {
    return notFound();
  }
  const shortcode = segments[0];
  const result = await fetchShortenedUrl(shortcode);
  if (!result.url) {
    return notFound();
  }
  redirect(result.url);
}
