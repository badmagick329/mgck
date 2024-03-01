"use client";
import { GfyDetailResponse } from "@/lib/types";
import Loading from "@/app/loading";
import DesktopDetails from "./desktop-details";
import GfyPlayer from "./gfy-player";
import ShareButtons from "./share-buttons";
import NavButtons from "./nav-buttons";

export default function DesktopView({
  gfyDetail,
}: {
  gfyDetail: GfyDetailResponse | null;
}) {
  if (!gfyDetail) {
    return (
      <div className="max-w-screen m-0 flex h-screen flex-col items-center justify-center">
        <Loading />
      </div>
    );
  }
  return (
    <div className="max-w-screen m-0 flex h-screen flex-col items-center justify-center">
      <div className="flex h-full w-full justify-between">
        <div className="flex w-4/5 justify-center">
          <GfyPlayer videoUrl={gfyDetail.video_url} />
        </div>
        <div className="hidden h-full justify-between md:flex md:w-1/5 md:flex-col md:flex-wrap">
          <div className="flex max-h-full w-full flex-col space-y-2 p-2">
            <DesktopDetails gfyDetail={gfyDetail} />
          </div>
          <div className="flex flex-col gap-2 pb-2">
            <ShareButtons
              imgurId={gfyDetail?.imgur_id}
              videoUrl={gfyDetail?.video_url}
            />
            <NavButtons />
          </div>
        </div>
      </div>
    </div>
  );
}
