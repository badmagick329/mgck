import { ComebackResponse } from '@/lib/types/kpop';

import ComebackCard from './ComebackCard';

export default function KpopResults({
  comebacks,
}: {
  comebacks: ComebackResponse[];
}) {
  if (comebacks.length === 0) {
    return (
      <div className='flex min-h-[16rem] w-full flex-1 items-center justify-center rounded-sm border border-dashed border-primary-kp/35 bg-primary-kp/5 px-6 py-12 text-center text-muted-foreground'>
        No releases matched this timeline and filter combination.
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3'>
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
  );
}
