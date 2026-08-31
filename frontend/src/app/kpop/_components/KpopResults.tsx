import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { dayOffsetFromToday, relativeDayLabel } from '@/lib/kpop';
import { ComebackDateGroup, groupComebacksByDate } from '@/lib/kpop/results';
import { ComebackResponse } from '@/lib/types/kpop';

import ComebackYoutubeLinks from './ComebackYoutubeLinks';
import FollowArtistButton from './FollowArtistButton';

export default function KpopResults({
  comebacks,
}: {
  comebacks: ComebackResponse[];
}) {
  if (comebacks.length === 0) {
    return (
      <div className='flex min-h-[16rem] w-full flex-1 items-center justify-center rounded-sm border border-dashed border-primary-kp/35 bg-primary-kp/5 px-6 py-12 text-center text-muted-foreground'>
        No releases matched this timeline and filter combination.
      </div>
    );
  }

  const groups = groupComebacksByDate(comebacks);

  return (
    <>
      <DesktopComebackTable groups={groups} />
      <MobileComebackList groups={groups} />
    </>
  );
}

function DesktopComebackTable({ groups }: { groups: ComebackDateGroup[] }) {
  return (
    <div className='hidden w-full overflow-hidden rounded-sm border border-primary-kp/25 bg-background/35 md:block'>
      <Table className='table-fixed' aria-label='K-pop comeback releases'>
        <TableHeader>
          <TableRow className='border-primary-kp/25 hover:bg-transparent'>
            <TableHead className='w-[23%] px-4'>Artist</TableHead>
            <TableHead className='w-[27%] px-4'>Release</TableHead>
            <TableHead className='w-[32%] px-4'>Album and type</TableHead>
            <TableHead className='w-[18%] px-4'>YouTube</TableHead>
          </TableRow>
        </TableHeader>
        {groups.map((group) => (
          <DesktopDateGroup key={group.date} group={group} />
        ))}
      </Table>
    </div>
  );
}

function DesktopDateGroup({ group }: { group: ComebackDateGroup }) {
  const dayOffset = dayOffsetFromToday(group.date);
  const isToday = dayOffset === 0;
  return (
    <TableBody>
      <TableRow
        className={`scroll-mt-4 ${dateGroupSurfaceClass(dayOffset)}`}
        data-kpop-today={isToday ? 'true' : undefined}
      >
        <TableCell colSpan={4} className='px-4 py-3'>
          <DateGroupLabel date={group.date} count={group.comebacks.length} />
        </TableCell>
      </TableRow>
      {group.comebacks.map((comeback) => (
        <TableRow
          key={comeback.id}
          className='border-primary-kp/15 align-top hover:bg-primary-kp/5'
        >
          <TableCell className='whitespace-normal px-4 py-3 font-medium'>
            <div className='flex items-start justify-between gap-2'>
              <span className='break-words pt-2'>{comeback.artist}</span>
              <FollowArtistButton
                publicId={comeback.artist_public_id}
                displayName={comeback.artist}
              />
            </div>
          </TableCell>
          <TableCell className='whitespace-normal px-4 py-5'>
            <span className='break-words font-medium'>{comeback.title}</span>
          </TableCell>
          <TableCell className='whitespace-normal px-4 py-5'>
            <div className='flex flex-col gap-1'>
              <span className='break-words'>{comeback.album}</span>
              <span className='break-words text-xs text-muted-foreground'>
                {comeback.release_type}
              </span>
            </div>
          </TableCell>
          <TableCell className='whitespace-normal px-4 py-5'>
            <ComebackYoutubeLinks
              urls={comeback.urls}
              artist={comeback.artist}
              title={comeback.title}
              releaseDate={comeback.date}
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}

function MobileComebackList({ groups }: { groups: ComebackDateGroup[] }) {
  return (
    <div
      className='flex w-full flex-col gap-5 md:hidden'
      aria-label='K-pop comeback releases, compact view'
      role='region'
    >
      {groups.map((group) => {
        const dayOffset = dayOffsetFromToday(group.date);
        const isToday = dayOffset === 0;
        return (
          <section
            key={group.date}
            className='scroll-mt-4 overflow-hidden rounded-sm border border-primary-kp/25 bg-background/35'
            data-kpop-today={isToday ? 'true' : undefined}
          >
            <div
              className={`border-b px-4 py-3 ${dateGroupSurfaceClass(dayOffset)}`}
            >
              <DateGroupLabel
                date={group.date}
                count={group.comebacks.length}
              />
            </div>
            <ul className='divide-y divide-primary-kp/15'>
              {group.comebacks.map((comeback) => (
                <li
                  key={comeback.id}
                  className='flex flex-col gap-2.5 px-4 py-4'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex min-w-0 flex-col gap-1'>
                      <span className='break-words font-semibold'>
                        {comeback.artist}
                      </span>
                      <span className='break-words text-sm'>
                        {comeback.title}
                      </span>
                    </div>
                    <FollowArtistButton
                      publicId={comeback.artist_public_id}
                      displayName={comeback.artist}
                    />
                  </div>
                  <div className='flex flex-col gap-0.5 text-xs text-muted-foreground'>
                    <span className='break-words'>{comeback.album}</span>
                    <span className='break-words'>{comeback.release_type}</span>
                  </div>
                  <ComebackYoutubeLinks
                    urls={comeback.urls}
                    artist={comeback.artist}
                    title={comeback.title}
                    releaseDate={comeback.date}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function DateGroupLabel({ date, count }: { date: string; count: number }) {
  const dayOffset = dayOffsetFromToday(date);
  const isToday = dayOffset === 0;
  return (
    <div className='flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1'>
      <div className='flex flex-wrap items-baseline gap-2'>
        <time
          dateTime={date}
          className={`text-base ${dateGroupTextClass(dayOffset)}`}
        >
          {formatReleaseDate(date)}
        </time>
        <span className='text-xs font-medium text-muted-foreground'>
          {relativeDayLabel(dayOffset)}
        </span>
      </div>
      <span className='text-xs text-muted-foreground'>
        {count} release{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function dateGroupSurfaceClass(dayOffset: number) {
  if (dayOffset === 0) {
    return 'border-green-400/30 bg-green-500/10 hover:bg-green-500/10';
  }
  if (dayOffset < 0) {
    return 'border-orange-400/20 bg-orange-500/5 hover:bg-orange-500/5';
  }
  return 'border-cyan-400/20 bg-cyan-500/5 hover:bg-cyan-500/5';
}

function dateGroupTextClass(dayOffset: number) {
  if (dayOffset === 0) {
    return 'font-bold text-green-700 dark:text-green-300';
  }
  if (dayOffset < 0) {
    return 'font-semibold text-orange-800/80 dark:text-orange-200/80';
  }
  return 'font-semibold text-cyan-800/80 dark:text-cyan-200/80';
}

function formatReleaseDate(date: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${date}T00:00:00Z`));
}
