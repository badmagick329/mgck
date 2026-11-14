import { useEffect, useState } from 'react';
import { generateTimelineThumbnails } from '@/lib/discordgifs/timeline-thumbnails';

/**
 * Frames appear as they are drawn so long clips fill in progressively. A
 * failure part-way clears them: a plain bar reads better than a strip with gaps.
 */
export function useTimelineThumbnails(url: string, duration: number | null) {
  const [frames, setFrames] = useState<string[]>([]);

  useEffect(() => {
    setFrames([]);
    if (!url || !duration) return;
    const controller = new AbortController();
    void generateTimelineThumbnails(url, duration, {
      signal: controller.signal,
      onFrame: (index, image) => {
        if (controller.signal.aborted) return;
        setFrames((previous) => {
          const next = [...previous];
          next[index] = image;
          return next;
        });
      },
    }).then((complete) => {
      if (!complete && !controller.signal.aborted) setFrames([]);
    });
    return () => controller.abort();
  }, [url, duration]);

  return frames;
}
