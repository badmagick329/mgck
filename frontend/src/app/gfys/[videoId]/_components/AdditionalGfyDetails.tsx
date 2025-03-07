import Navbar from '@/app/_components/Navbar';
import { GFYS_BASE } from '@/lib/consts/urls';
import { GfyDetailResponse } from '@/lib/types/gfys';
import Link from 'next/link';

export default function AdditionalGfyDetails({
  gfyDetail,
}: {
  gfyDetail: GfyDetailResponse;
}) {
  return (
    <>
      <div className='flex justify-end'>
        <Navbar />
      </div>
      <span className='break-words text-sm lg:text-base xl:text-xl'>
        {gfyDetail.title}
      </span>
      <div className='flex flex-col'>
        <div className='flex flex-wrap gap-2 py-2'>
          {gfyDetail.tags.map((tag, key) => {
            return (
              <Link
                key={key}
                href={{
                  pathname: `${GFYS_BASE}`,
                  query: { tags: tag },
                }}
              >
                <div className='my-2'>
                  <span className='hover:cursor rounded-lg bg-gray-300/80 py-1 text-sm text-black hover:bg-gray-300 dark:bg-gray-800/80 dark:text-white dark:hover:bg-gray-800 sm:px-1 sm:py-2'>
                    {tag}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
        {gfyDetail.date && (
          <span className='text-sm lg:text-base xl:text-xl'>
            <strong>Date:</strong> {gfyDetail.date}
          </span>
        )}
        <span className='text-sm lg:text-base xl:text-xl'>
          <strong>Account:</strong> {gfyDetail.account}
        </span>
      </div>
    </>
  );
}
