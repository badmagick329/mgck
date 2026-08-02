import { useGfyContext } from '@/app/gfys/_context/store';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { GFYS_BASE } from '@/lib/consts/urls';
import {
  imgurIdToImgurVideo,
  imgurIdToThumbnail,
  imgurIdToVideo,
  formatGfyViewCount,
} from '@/lib/gfys';
import Image from 'next/image';
import Link from 'next/link';
import { Eye } from 'lucide-react';

export default function GfyPreview({
  title,
  imgurId,
  index,
  width,
  height,
  viewCount,
}: {
  title: string;
  imgurId: string;
  index: number;
  width: number | null;
  height: number | null;
  viewCount: number;
}) {
  const { goToGfyAtIndex } = useGfyContext();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            <Link
              className='group relative block h-[150px] w-[150px]'
              href={{
                pathname: `${GFYS_BASE}/${imgurId}`,
              }}
              onClick={() => goToGfyAtIndex(index)}
              aria-label={`${title || `Red Velvet Gfy ${imgurId}`} — ${formatGfyViewCount(viewCount)} views`}
            >
              <Image
                className='hover:ring-bg-primary-gf rounded-md object-cover hover:cursor-pointer hover:ring-2 hover:ring-offset-2'
                src={imgurIdToThumbnail(imgurId)}
                alt={title || `Red Velvet Gfy ${imgurId}`}
                width={150}
                height={150}
                style={{ width: '150px', height: '150px' }}
                unoptimized
              />
              <span className='absolute bottom-1 right-1 inline-flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-1 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'>
                <Eye aria-hidden='true' className='h-3.5 w-3.5' />
                {formatGfyViewCount(viewCount)}
                <span className='sr-only'>views</span>
              </span>
            </Link>
          </div>
        </TooltipTrigger>
        <TooltipContent className='bg-background-gf dark:bg-background-gf-dark'>
          <div className='flex flex-col gap-2'>
            <p className='max-w-[250px] break-words'>{title}</p>
            <div className='flex justify-center rounded-md p-2'>
              <VideoPreview imgurId={imgurId} width={width} height={height} />
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function VideoPreview({
  imgurId,
  width,
  height,
}: {
  imgurId: string;
  width: number | null;
  height: number | null;
}) {
  const maxVideoWidth = 400;
  if (width === null || height === null) {
    return (
      <video
        className='rounded-md'
        autoPlay
        loop
        muted
        width={(maxVideoWidth / 2).toString()}
      >
        <source src={imgurIdToVideo(imgurId)} />
        <source src={imgurIdToImgurVideo(imgurId)} />
      </video>
    );
  }

  if (width > height) {
    return (
      <video
        className='rounded-md'
        autoPlay
        loop
        muted
        width={maxVideoWidth.toString()}
      >
        <source src={imgurIdToVideo(imgurId)} />
        <source src={imgurIdToImgurVideo(imgurId)} />
      </video>
    );
  }

  if (width <= height) {
    const widthDivisor = height / maxVideoWidth;
    const videoWidth = Math.round(width / widthDivisor);
    return (
      <video className='rounded-md' autoPlay loop muted width={videoWidth}>
        <source src={imgurIdToVideo(imgurId)} />
        <source src={imgurIdToImgurVideo(imgurId)} />
      </video>
    );
  }
}
