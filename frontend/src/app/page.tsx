import Navbar from '@/app/_components/Navbar';

import DiscordGifsIntro from './_components/DiscordGifsIntro';
import EmojifyIntro from './_components/EmojifyIntro';
import GfysIntro from './_components/GfysIntro';
import KpopComebacksIntro from './_components/KpopComebacksIntro';
import Footer from './_components/Footer';

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
      <Footer />
    </main>
  );
}
