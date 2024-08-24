'use client';

import { useGlobalContext } from '@/app/gfys/context/store';
import { GFYS_BASE } from '@/lib/consts/urls';
import { cleanedSearchParams, createURL } from '@/lib/utils/gfys';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

import GfyPreview from './gfy-preview';

export default function GfyList() {
  const { data, setGfyViewData, updateDataFromParams } = useGlobalContext();
  const searchParams = useSearchParams();

  useEffect(() => {
    (async () => {
      await updateDataFromParams(searchParams);
    })();
  }, [searchParams]);

  useEffect(() => {
    let urlSearchParams = new URLSearchParams(searchParams.toString());
    urlSearchParams = cleanedSearchParams(urlSearchParams);
    setGfyViewData({
      index: 0,
      videoIds: data.gfys.map((g) => g.imgurId),
      listUrl: createURL(GFYS_BASE, urlSearchParams.toString()),
    });
  }, [data]);

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
