import Navbar from '@/app/_components/Navbar';

import DiscordGifsIntro from './_components/DiscordGifsIntro';
import EmojifyIntro from './_components/EmojifyIntro';
import GfysIntro from './_components/GfysIntro';
import KpopComebacksIntro from './_components/KpopComebacksIntro';
import Footer from './_components/Footer';
import UrlShortenerIntro from './_components/UrlShortenerIntro';
import { ParsedToken } from '@/lib/account/parsed-token';
import { canUseShortener } from '@/lib/account/permissions';
import clsx from 'clsx';

export default async function Index() {
  const token = await ParsedToken.createFromCookie();
  const shortenerAllowed = canUseShortener(token);
  return (
    <main className='flex min-h-dvh flex-col justify-center'>
      <Navbar />
      <div
        className={clsx(
          `grid grow grid-cols-1 place-content-center`,
          shortenerAllowed ? 'grid-rows-5' : 'grid-rows-4'
        )}
      >
        {shortenerAllowed && <UrlShortenerIntro />}
        <GfysIntro />
        <KpopComebacksIntro />
        <EmojifyIntro />
        <DiscordGifsIntro />
      </div>
      <Footer />
    </main>
  );
}
