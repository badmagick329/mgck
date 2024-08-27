'use client';

import useWindowSize from '@/hooks/use-window-resize';
import { GfyDetailResponse } from '@/lib/types';
import { cn } from '@/lib/utils';
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
  const { isDesktopOrLandscape } = useWindowSize();

  useEffect(() => {
    setGfyDetail(props.gfyDetail);
  }, []);

  if (!gfyDetail) {
    return null;
  }

  return (
    <div
      className={cn(
        'max-w-screen m-0 flex h-dvh',
        isDesktopOrLandscape
          ? 'flex-row content-between justify-center'
          : 'flex-col content-center justify-between'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center',
          isDesktopOrLandscape ? 'h-full w-4/5' : 'h-4/5 w-full'
        )}
      >
        <GfyPlayer videoUrl={gfyDetail.video_url} />
      </div>
      {isDesktopOrLandscape ? (
        <div className='flex w-1/5 flex-col flex-wrap justify-between'>
          <div className='flex max-h-full w-full flex-col space-y-2 p-2'>
            <AdditionalGfyDetails gfyDetail={gfyDetail} />
          </div>
          <div className='flex flex-col gap-2 justify-self-end pb-2'>
            <ShareButtons
              imgurId={gfyDetail?.imgur_id}
              videoUrl={gfyDetail?.video_url}
            />
            <NavButtons />
          </div>
        </div>
      ) : (
        <div className='flex h-1/5 flex-col'>
          <div className='flex flex-col gap-2  pb-2'>
            <ShareButtons
              imgurId={gfyDetail?.imgur_id}
              videoUrl={gfyDetail?.video_url}
            />
            <NavButtons />
          </div>
        </div>
      )}
    </div>
  );
}
