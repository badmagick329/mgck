import { GfyDetailResponse } from '@/lib/types';

import GfyPlayer from './gfy-player';
import NavButtons from './nav-buttons';
import ShareButtons from './share-buttons';

export default function MobileView({
  gfyDetail,
}: {
  gfyDetail: GfyDetailResponse | null;
}) {
  if (!gfyDetail) {
    return null;
  }
  return (
    <div className='max-w-screen m-0 flex h-dvh flex-col items-center justify-between'>
      <div className='flex h-4/5 w-full flex-col justify-center'>
        <GfyPlayer videoUrl={gfyDetail.video_url} />
      </div>
      <div className='h-1/7 flex w-full flex-col justify-center'>
        <div className='flex justify-center gap-2'>
          <ShareButtons
            imgurId={gfyDetail.imgur_id}
            videoUrl={gfyDetail.video_url}
          />
          <NavButtons />
        </div>
      </div>
    </div>
  );
}
