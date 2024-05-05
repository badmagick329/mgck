import { Button } from '@/components/ui/button';
import { MEDIUM_ICON, SMALL_ICON } from '@/lib/consts';
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
    <Link href={url} target='_blank'>
      <Button className='flex gap-2' variant='link'>
        <span>Search youtube</span>
        <ExternalLink size={SMALL_ICON} />
      </Button>
    </Link>
  );
}
