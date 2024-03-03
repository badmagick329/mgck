import GfyView from "./_components/gfy-view";
import { fetchGfy } from "@/actions/actions";
import { Metadata } from "next";

type Props = {
  params: { videoId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gfyDetail = await fetchGfy(params.videoId);
  const baseURL = gfyDetail.video_url.includes("imgur.com/")
    ? "https://imgur.com"
    : "https://mgck.ink";
  return {
    metadataBase: new URL(baseURL),
    title: `${gfyDetail.title}`,
    openGraph: {
      title: `${gfyDetail.title}`,
      url: gfyDetail.video_url,
      type: "video.other",
      videos: [
        {
          url: gfyDetail.video_url,
          width: 1920,
          height: 1080,
          type: "video/mp4",
        },
      ],
      images: [
        {
          url: `https://i.imgur.com/${gfyDetail.imgur_id}.jpg`,
          width: 1920,
          height: 1080,
          alt: `${gfyDetail.title}`,
        },
      ],
    },
    twitter: {
      card: "player",
      site: "@mgck",
      players: [
        {
          playerUrl: gfyDetail.video_url,
          streamUrl: gfyDetail.video_url,
          width: 1920,
          height: 1080,
        },
      ],
    },
  };
}

export default async function GfyPage({
  params,
}: {
  params: { videoId: string };
}) {
  const gfyDetail = await fetchGfy(params.videoId);
  return <GfyView params={params} gfyDetail={gfyDetail} />;
}
