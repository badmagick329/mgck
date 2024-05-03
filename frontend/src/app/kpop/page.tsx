import { fetchComebacks } from '@/actions/kpop';
import { ThemeToggler } from '@/components/theme-toggler';
import { Input } from '@/components/ui/input';

import ComebackCard from './_components/comeback-card';

export default async function KpopPage() {
  const comebacksResult = await fetchComebacks();
  const comebacks = comebacksResult.results.slice(0, 9);

  return (
    <main className='flex min-h-screen flex-col items-center'>
      <div className='flex w-full justify-end px-2 pt-2'>
        <ThemeToggler />
      </div>
      <form className='grid grid-cols-1 gap-4 md:grid-cols-2'>
        <Input name='title' placeholder='Title' />
        <Input name='artist' placeholder='Artist' />
        <Input name='state-date' placeholder='Start Date (YYYY-MM-DD)' />
        <Input name='end-date' placeholder='End Date (YYYY-MM-DD)' />
      </form>
      <div className='flex flex-col items-center gap-4 pt-4'>
        <h2 className='text-2xl font-semibold'>Upcoming Comebacks</h2>
        <div className='grid grid-cols-1 gap-12 px-4 xl:grid-cols-2 2xl:grid-cols-3'>
          {comebacks.map((comeback) => (
            <ComebackCard
              key={comeback.id}
              title={comeback.title}
              artist={comeback.artist}
              album={comeback.album}
              releaseType={comeback.release_type}
              releaseDate={comeback.date}
              urls={comeback.urls}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
