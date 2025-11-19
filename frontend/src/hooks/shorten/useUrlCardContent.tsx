import { useToast } from '@/components/ui/use-toast';
import { ShortenedUrl } from '@/lib/types/shorten';
import { handleCopyToClipboard } from '@/lib/utils';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const MAX_URL_DISPLAY_LENGTH = 120;

export default function useUrlCardContent({
  shortenedUrl,
  buttonSize,
}: {
  shortenedUrl: ShortenedUrl;
  buttonSize: number;
}) {
  const { toast } = useToast();
  const [truncated, setTruncated] = useState(true);

  const baseUrl =
    process.env.NEXT_PUBLIC_DEV_URL || `https://${window.location.hostname}`;
  const shortUrl = `${baseUrl}/${shortenedUrl.short_id}`;
  let sourceUrl = truncated
    ? shortenedUrl.url.slice(0, MAX_URL_DISPLAY_LENGTH)
    : shortenedUrl.url;
  truncated &&
    shortenedUrl.url.length > MAX_URL_DISPLAY_LENGTH &&
    (sourceUrl += '...');

  return {
    shortUrl,
    sourceUrl,
    truncateButtonTooltip: truncated ? 'Expand' : 'Collapse',
    showTruncateIcon: shortenedUrl.url.length > MAX_URL_DISPLAY_LENGTH,
    TruncateIcon: () =>
      truncated ? (
        <ChevronDown size={buttonSize} />
      ) : (
        <ChevronUp size={buttonSize} />
      ),
    handleCopy: async () => handleCopyToClipboard(shortUrl, toast),
    handleTruncate: () => setTruncated((prev) => !prev),
  };
}
