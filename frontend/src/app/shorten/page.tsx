import type { Metadata } from 'next';

import UrlShortenerForm from './_components/url-shortener-form';

export const metadata: Metadata = {
  title: 'URL Shortener',
};

export default function UrlShortenerPage() {
  return (
    <main className='flex min-h-screen flex-col items-center pt-16'>
      <UrlShortenerForm />
    </main>
  );
}
