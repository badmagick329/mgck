'use client';

import { GfyDetailResponse } from '@/lib/types/gfys';
import { imgurIdToThumbnail } from '@/lib/gfys';
import { useEffect } from 'react';
import { useGfyContext } from '@/app/gfys/_context/store';

import AdditionalGfyDetails from './AdditionalGfyDetails';
import GfyPlayer from './GfyPlayer';
import NavButtons from './NavButtons';
import ShareButtons from './ShareButtons';
import RelatedGfys from './RelatedGfys';

type Props = {
  params: {
    videoId: string;
  };
  gfyDetail: GfyDetailResponse;
};

export default function GfyView(props: Props) {
  const { gfyDetail } = props;
  const { reconcileCurrentGfy } = useGfyContext();
  useEffect(() => {
    reconcileCurrentGfy(gfyDetail.imgur_id);
  }, [gfyDetail.imgur_id, reconcileCurrentGfy]);

  return (
    <main className='dark:bg-background-dark min-h-dvh bg-background-gf p-3 sm:p-5'>
      <div className='grid w-full items-start gap-5 lg:min-h-[calc(100dvh-2.5rem)] lg:grid-cols-[minmax(0,1fr)_20rem] lg:grid-rows-[1fr_auto]'>
        <div className='grid min-w-0 gap-5 lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_20rem] lg:self-center'>
          <div className='min-w-0 lg:self-center'>
            <GfyPlayer
              key={gfyDetail.video_url}
              videoUrl={gfyDetail.video_url}
              poster={imgurIdToThumbnail(gfyDetail.imgur_id)}
            />
          </div>
          <div className='flex min-w-0 flex-col gap-4 lg:justify-between'>
            <div className='space-y-4'>
              <AdditionalGfyDetails gfyDetail={gfyDetail} />
            </div>
            <div className='space-y-2'>
              <ShareButtons
                imgurId={gfyDetail.imgur_id}
                videoUrl={gfyDetail.video_url}
              />
              <NavButtons />
            </div>
          </div>
        </div>
        <div className='min-w-0 lg:col-start-1'>
          <RelatedGfys clips={gfyDetail.related_clips} />
        </div>
      </div>
    </main>
  );
}
