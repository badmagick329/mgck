import GfyView from "./_components/gfy-view";
import { fetchGfy } from "@/actions/actions";
import { Metadata } from "next";

type Props = {
  params: { videoId: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const gfyDetail = await fetchGfy(params.videoId);
  return {
    metadataBase: new URL("https://mgck.ink"),
    title: `${gfyDetail.title}`,
    openGraph: {
      title: `${gfyDetail.title}`,
      url: `https://mgck.ink/gfys/${params.videoId}`,
      type: "video.other",
      videos: [
        {
          url: `https://mgck.ink/gfy-videos/${params.videoId}.mp4`,
          width: 720,
          height: 480,
          type: "video/mp4",
        },
      ],
      images: [
        {
          url: `https://i.imgur.com/${gfyDetail.imgur_id}.jpg`,
          width: 720,
          height: 480,
          alt: `${gfyDetail.title}`,
        },
      ],
    },
    twitter: {
      card: "player",
      site: "@mgck",
      players: [
        {
          playerUrl: `https://mgck.ink/gfy-videos/${params.videoId}.mp4`,
          streamUrl: `https://mgck.ink/gfy-videos/${params.videoId}.mp4`,
          width: 720,
          height: 480,
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
