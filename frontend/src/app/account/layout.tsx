import type { Metadata } from 'next';

// Login, status and account pages are private UI with redirect variants
// (`?returnTo=`) that Search Console reports as duplicates. Every public page
// they link to is reachable from public pages, so nothing is lost by nofollow.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
