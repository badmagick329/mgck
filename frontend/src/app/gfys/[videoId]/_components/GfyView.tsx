'use client';

import { GfyDetailResponse } from '@/lib/types/gfys';
import { useEffect, useState } from 'react';

import AdditionalGfyDetails from './AdditionalGfyDetails';
import GfyPlayer from './GfyPlayer';
import NavButtons from './NavButtons';
import ShareButtons from './ShareButtons';
import Footer from '@/app/_components/Footer';

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
    <div className='max-w-screen dark:bg-background-dark m-0 flex h-dvh flex-col bg-background-gf sm:flex-row sm:content-between sm:justify-center'>
      <div className='flex h-4/5 w-full items-center justify-center sm:h-full sm:w-4/5'>
        <GfyPlayer videoUrl={gfyDetail.video_url} />
      </div>
      <div className='flex justify-center p-2 sm:w-1/5 sm:flex-col sm:justify-end mdp:justify-between'>
        <div className='hidden mdp:block'>
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
