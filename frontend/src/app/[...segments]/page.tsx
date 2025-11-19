import { getShortenedUrl } from '@/actions/urlshortener';
import { notFound, redirect } from 'next/navigation';

export default async function ShortCodePage({
  params,
}: {
  params: Promise<{ segments: string[] }>;
}) {
  const { segments } = await params;
  if (segments.length !== 1) {
    return notFound();
  }
  const shortcode = segments[0];
  const result = await getShortenedUrl(shortcode);
  if (!result.url) {
    return notFound();
  }
  redirect(result.url);
}
