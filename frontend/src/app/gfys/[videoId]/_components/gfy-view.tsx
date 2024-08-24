'use client';

import DesktopView from '@/app/gfys/[videoId]/_components/desktop-view';
import MobileView from '@/app/gfys/[videoId]/_components/mobile-view';
import useWindowSize from '@/hooks/use-window-resize';
import { GfyDetailResponse } from '@/lib/types';
import { useEffect, useState } from 'react';

type Props = {
  params: {
    videoId: string;
  };
  gfyDetail: GfyDetailResponse;
};

export default function GfyView(props: Props) {
  const [gfyDetail, setGfyDetail] = useState<GfyDetailResponse | null>(null);
  const MOBILE_BREAKPOINT = 768;
  const size = useWindowSize();

  useEffect(() => {
    setGfyDetail(props.gfyDetail);
  }, []);

  if (size.width > MOBILE_BREAKPOINT) {
    return <DesktopView gfyDetail={gfyDetail} />;
  } else {
    return <MobileView gfyDetail={gfyDetail} />;
  }
}
