import { ThemeToggler } from '@/components/theme-toggler';
import { GFYS_BASE } from '@/lib/consts/urls';
import { GfyDetailResponse } from '@/lib/types';
import Link from 'next/link';

export default function AdditionalGfyDetails({
  gfyDetail,
}: {
  gfyDetail: GfyDetailResponse;
}) {
  return (
    <>
      <div className='flex justify-end'>
        <div className='px-4'>
          <ThemeToggler />
        </div>
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
                  <span className='hover:cursor rounded-lg border-2 bg-gray-400 py-1 text-sm text-black dark:bg-gray-800 dark:text-white sm:px-1 sm:py-2'>
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
