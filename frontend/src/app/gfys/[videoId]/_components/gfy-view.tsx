'use client';

import { GfyDetailResponse } from '@/lib/types';
import { useEffect, useState } from 'react';

import AdditionalGfyDetails from './additional-gfy-details';
import GfyPlayer from './gfy-player';
import NavButtons from './nav-buttons';
import ShareButtons from './share-buttons';

type Props = {
  params: {
    videoId: string;
  };
  gfyDetail: GfyDetailResponse;
};

export default function GfyView(props: Props) {
  const [gfyDetail, setGfyDetail] = useState<GfyDetailResponse | null>(null);

  useEffect(() => {
    setGfyDetail(props.gfyDetail);
  }, []);

  if (!gfyDetail) {
    return null;
  }

  return (
    <div className='max-w-screen m-0 flex h-dvh flex-col sm:flex-row sm:content-between sm:justify-center'>
      <div className='flex h-4/5 w-full items-center justify-center sm:h-full sm:w-4/5'>
        <GfyPlayer videoUrl={gfyDetail.video_url} />
      </div>
      <div className='mdp:justify-between flex justify-center p-2 sm:flex-col sm:justify-end'>
        <div className='mdp:block hidden'>
          <AdditionalGfyDetails gfyDetail={gfyDetail} />
        </div>
        <div className='flex flex-col gap-2'>
          <ShareButtons
            imgurId={gfyDetail?.imgur_id}
            videoUrl={gfyDetail?.video_url}
          />
          <NavButtons />
        </div>
      </div>
    </div>
  );
}
