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
import ImageEditIntro from '@/app/_components/ImageEditIntro';
import MilestonesIntro from '@/app/_components/MilestonesIntro';

export default async function Index() {
  const token = await ParsedToken.createFromCookie();
  const shortenerAllowed = canUseShortener(token);
  return (
    <main className='flex min-h-dvh flex-col justify-center'>
      <Navbar />
      <div
        className={clsx(
          `grid grow grid-cols-1 place-content-center`,
          shortenerAllowed ? 'grid-rows-7' : 'grid-rows-6'
        )}
      >
        <MilestonesIntro />
        {shortenerAllowed && <UrlShortenerIntro />}
        <GfysIntro />
        <KpopComebacksIntro />
        <ImageEditIntro />
        <EmojifyIntro />
        <DiscordGifsIntro />
      </div>
      <Footer />
    </main>
  );
}
