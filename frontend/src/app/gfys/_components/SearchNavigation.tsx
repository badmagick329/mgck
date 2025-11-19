'use client';

import NavButton from './NavButton';
import useSearchNavigation from '@/hooks/gfys/useSearchNavigation';

export default function SearchNavigation({ onClient }: { onClient: boolean }) {
  const { data, leftRef, rightRef, pathname, currentPage } =
    useSearchNavigation({ onClient });

  return (
    <div className='mt-4 flex flex-col items-center space-y-2'>
      <div className='flex justify-center space-x-2'>
        <NavButton
          url={data.previous}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType='first'
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
        <NavButton
          url={data.previous}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType='previous'
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
        <NavButton
          url={data.next}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType='next'
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
        <NavButton
          url={data.next}
          prevURL={data.previous}
          nextURL={data.next}
          totalPages={data.totalPages}
          navType='last'
          leftRef={leftRef}
          rightRef={rightRef}
          pathname={pathname}
        />
      </div>
      <PaginationText currentPage={currentPage} totalPages={data.totalPages} />
    </div>
  );
}

function PaginationText({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  if (totalPages <= 1) {
    return null;
  }
  return (
    <div className='text-gray-800 dark:text-gray-500'>
      Page {currentPage} of {totalPages}
    </div>
  );
}
