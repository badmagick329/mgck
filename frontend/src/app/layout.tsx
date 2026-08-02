import { ThemeProvider } from '@/app/_components/ThemeProvider';
import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';
import Script from 'next/script';

import './globals.css';

const font = Quicksand({
  weight: ['300', '400', '500', '700', '600'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://mgck.ink'),
  title: {
    default: 'mgck',
    template: '%s | mgck',
  },
  description:
    'A Red Velvet GIF archive, K-pop comeback tracker, and a few small web tools.',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    siteName: 'mgck',
  },
  twitter: {
    card: 'summary',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <Script
          src='/ingest/js/script.js'
          data-domain='mgck.ink'
          data-api='/ingest/api/event'
        />
      </head>
      <body className={`${font.className} tracking-wide`}>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
