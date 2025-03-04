'use client';

import { useGfyContext } from '@/app/gfys/_context/store';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import GfyPreview from './gfy-preview';

export default function GfyList() {
  const { data, updateDataFromParams } = useGfyContext();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      await updateDataFromParams(searchParams);
    })();
  }, [searchParams]);

  return (
    <div className='flex w-full flex-wrap justify-center gap-2 overflow-hidden py-2 lg:w-2/3'>
      {data.gfys.map((d, key) => (
        <GfyPreview
          key={key}
          title={d.title}
          imgurId={d.imgurId}
          index={key}
          width={d.width}
          height={d.height}
        />
      ))}
    </div>
  );
}
