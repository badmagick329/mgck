import { fetchGfy } from '@/actions/gfys';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';

import GfyView from './_components/GfyView';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ videoId: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const gfyDetail = await fetchGfy(resolvedParams.videoId);
  if (gfyDetail === null) {
    return {
      title: 'Not Found',
    };
  }
  const width = gfyDetail.width || 1920;
  const height = gfyDetail.height || 1080;

  return {
    metadataBase: new URL('https://mgck.ink'),
    title: `${gfyDetail.title}`,
    keywords: gfyDetail.tags.concat(['gfy', 'gfycat', 'kpop']),
    openGraph: {
      title: `${gfyDetail.title}`,
      url: gfyDetail.video_url,
      type: 'video.other',
      videos: [
        {
          url: gfyDetail.video_url,
          width,
          height,
          type: 'video/mp4',
        },
      ],
      images: [
        {
          url: `https://i.imgur.com/${gfyDetail.imgur_id}.jpg`,
          width,
          height,
          alt: `${gfyDetail.title}`,
        },
      ],
    },
    twitter: {
      card: 'player',
      site: '@mgck',
      players: [
        {
          playerUrl: gfyDetail.video_url,
          streamUrl: gfyDetail.video_url,
          width,
          height,
        },
      ],
    },
  };
}

export default async function GfyPage({
  params,
}: {
  params: Promise<{ videoId: string }>;
}) {
  const resolvedParams = await params;
  const gfyDetail = await fetchGfy(resolvedParams.videoId);
  if (gfyDetail === null) {
    return notFound();
  }
  return <GfyView params={resolvedParams} gfyDetail={gfyDetail} />;
}
