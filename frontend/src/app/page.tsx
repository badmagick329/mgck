import Navbar from '@/components/navbar';

import DiscordGifsIntro from './_components/discord-gifs-intro';
import EmojifyIntro from './_components/emojify-intro';
import GfysIntro from './_components/gfys-intro';
import KpopComebacksIntro from './_components/kpop-comebacks-intro';

export default function Index() {
  return (
    <main className='flex min-h-dvh flex-col justify-center'>
      <Navbar />
      <div className='grid grow grid-cols-1 grid-rows-4 place-content-center'>
        <GfysIntro />
        <KpopComebacksIntro />
        <EmojifyIntro />
        <DiscordGifsIntro />
      </div>
    </main>
  );
}
