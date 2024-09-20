import { ThemeProvider } from '@/components/theme-provider';
import type { Metadata } from 'next';
import { Quicksand } from 'next/font/google';

import './globals.css';

const font = Quicksand({
  weight: ['300', '400', '500', '700', '600'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mgck.ink',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' suppressHydrationWarning>
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
