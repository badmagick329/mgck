import { Button } from '@/components/ui/button';
import { SMALLER_ICON } from '@/lib/consts';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

const SEARCH_BASE = 'https://youtube.com/results?search_query=';
export default function YoutubeSearchLink({
  artist,
  title,
}: {
  artist: string;
  title: string;
}) {
  const url = encodeURI(`${SEARCH_BASE}${artist} ${title}`);
  return (
    <Link
      className='flex items-center justify-center gap-2 py-1 font-bold hover:underline'
      href={url}
      target='_blank'
    >
      <span className='text-xs'>Search youtube</span>
      <ExternalLink size={SMALLER_ICON} />
    </Link>
  );
}
