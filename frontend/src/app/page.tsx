import { ThemeToggler } from '@/components/theme-toggler';

import DiscordGifsIntro from './_components/discord-gifs-intro';
import EmojifyIntro from './_components/emojify-intro';
import GfysIntro from './_components/gfys-intro';
import KpopComebacksIntro from './_components/kpop-comebacks-intro';

export default function Index() {
  return (
    <main className='flex min-h-screen flex-col'>
      <div className='flex w-full justify-end px-2 pt-2'>
        <ThemeToggler />
      </div>
      <div className='flex grow flex-col items-center justify-center space-y-12 pt-12'>
        <GfysIntro />
        <KpopComebacksIntro />
        <EmojifyIntro />
        <DiscordGifsIntro />
      </div>
    </main>
  );
}
