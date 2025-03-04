import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const MAX_ALBUM_LENGTH = 30;
export default function ComebackCardAlbum({ album }: { album: string }) {
  const displayAlbum =
    album.length > MAX_ALBUM_LENGTH
      ? album.slice(0, MAX_ALBUM_LENGTH) + '...'
      : album;

  if (displayAlbum !== album) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
              {displayAlbum}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
              {album}
            </span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className='text-xs font-bold text-gray-600 dark:text-gray-400'>
      {album}
    </span>
  );
}
