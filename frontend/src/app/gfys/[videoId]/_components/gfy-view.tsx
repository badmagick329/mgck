"use client";
import { GfyDetailResponse } from "@/lib/types";
import { useState, useEffect } from "react";
import DesktopView from "@/app/gfys/[videoId]/_components/desktop-view";
import useWindowSize from "@/app/hooks/use-window-resize";
import MobileView from "@/app/gfys/[videoId]/_components/mobile-view";

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
