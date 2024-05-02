'use client';

import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { YOUTUBE_VIDEO_WIDTH } from '@/lib/consts';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import CarouselButtons from './carousel-buttons';
import YoutubePlayer from './youtube-player';

export default function YoutubePlayerCarousel({ urls }: { urls: string[] }) {
  const videoIds = urls.map((url) => url.split('v=')[1]).filter(Boolean);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const maxWidth = `max-w-[${YOUTUBE_VIDEO_WIDTH}px]`;

  if (videoIds.length === 0) {
    return null;
  }

  const toggleText = useMemo(() => {
    const prefix = isOpen ? 'Hide ' : 'Show ';
    if (videoIds.length === 1) {
      return `${prefix} youtube video`;
    }
    return `${prefix}youtube videos (${videoIds.length})`;
  }, [isOpen, videoIds]);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    setCount(carouselApi.scrollSnapList().length);
    setCurrent(carouselApi.selectedScrollSnap() + 1);

    carouselApi.on('select', () => {
      setCurrent(carouselApi.selectedScrollSnap() + 1);
    });
  }, [carouselApi]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className={maxWidth}>
      <div className='flex flex-col justify-center gap-4'>
        <CollapsibleTrigger asChild>
          <div className='flex justify-center gap-2 hover:cursor-pointer'>
            {toggleText}
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2'>
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'center',
            }}
            orientation='horizontal'
            className={`relative ${maxWidth} overflow-hidden`}
          >
            <CarouselContent>
              {videoIds.map((videoId) => (
                <CarouselItem key={videoId}>
                  <YoutubePlayer videoId={videoId} />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <CarouselButtons
            carouselApi={carouselApi}
            count={count}
            current={current}
          />
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
