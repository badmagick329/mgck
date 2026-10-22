import Link from 'next/link';
import Image from 'next/image';
import { imgurIdToThumbnail } from '@/lib/gfys';
import { GfyDetailResponse } from '@/lib/types/gfys';

export default function RelatedGfys({
  clips,
}: {
  clips: GfyDetailResponse['related_clips'];
}) {
  if (clips.length === 0) return null;

  return (
    <section
      aria-label='Related clips'
      className='min-w-0'
    >
      <h2 className='mb-2 text-sm font-semibold'>
        Related clips
      </h2>
      <div className='flex gap-3 overflow-x-auto pb-2'>
        {clips.map((clip) => (
          <Link
            key={clip.id}
            href={`/gfys/${encodeURIComponent(clip.id)}`}
            className='w-32 shrink-0 rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-gf'
          >
            <Image
              src={imgurIdToThumbnail(clip.imgur_id)}
              alt=''
              width={128}
              height={80}
              unoptimized
              className='h-20 w-32 rounded-md object-cover'
            />
            <span className='mt-1 line-clamp-2 break-words text-sm'>
              {clip.title}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
