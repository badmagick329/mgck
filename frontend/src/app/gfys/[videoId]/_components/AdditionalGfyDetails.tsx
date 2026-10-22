import Navbar from '@/app/_components/Navbar';
import { GFYS_BASE } from '@/lib/consts/urls';
import { GfyDetailResponse } from '@/lib/types/gfys';
import { formatGfyViewCount } from '@/lib/gfys';
import Link from 'next/link';

export default function AdditionalGfyDetails({
  gfyDetail,
}: {
  gfyDetail: GfyDetailResponse;
}) {
  return (
    <>
      <Navbar className='p-0' />
      <h1 className='break-words text-xl font-semibold'>
        {gfyDetail.display_title}
      </h1>
      <div className='flex flex-col'>
        <div className='mb-3 flex flex-wrap gap-1.5'>
          {gfyDetail.tags.map((tag, key) => {
            return (
              <Link
                key={key}
                className='rounded-md bg-gray-300/80 px-2 py-1 text-xs text-black hover:bg-gray-300 dark:bg-gray-800/80 dark:text-white dark:hover:bg-gray-800'
                href={{
                  pathname: `${GFYS_BASE}`,
                  query: { tags: tag },
                }}
              >
                {tag}
              </Link>
            );
          })}
        </div>
        {gfyDetail.date && (
          <span className='text-sm'>
            <strong>Date:</strong> {gfyDetail.date}
          </span>
        )}
        {gfyDetail.account && (
          <span className='text-sm'>
            <strong>Account:</strong> {gfyDetail.account}
          </span>
        )}
        <span className='text-sm'>
          <strong>Views:</strong> {formatGfyViewCount(gfyDetail.view_count)}
        </span>
        <div className='mt-3 space-y-1 break-words text-xs text-muted-foreground'>
          {gfyDetail.gfy_title && (
            <p>
              <strong>Original Gfycat title:</strong> {gfyDetail.gfy_title}
            </p>
          )}
          {gfyDetail.gfy_id && (
            <p>
              <strong>Original Gfycat slug:</strong> {gfyDetail.gfy_id}
            </p>
          )}
          {gfyDetail.title && gfyDetail.title !== gfyDetail.gfy_title && (
            <p>
              <strong>Imgur title:</strong> {gfyDetail.title}
            </p>
          )}
        </div>
      </div>
    </>
  );
}
