'use client';

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
import { VIDEO_CAROUSEL_WIDTH } from '@/lib/consts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import CarouselButtons from './carousel-buttons';
import YoutubePlayer from './youtube-player';

export default function YoutubeLinks({ videoIds }: { videoIds: string[] }) {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

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
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={VIDEO_CAROUSEL_WIDTH}
    >
      <div className='flex flex-col justify-center gap-4'>
        <CollapsibleTrigger asChild>
          <div className='flex justify-center gap-2 text-xs font-bold hover:cursor-pointer'>
            {toggleText}
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2'>
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'center',
            }}
            orientation='horizontal'
            className={`relative ${VIDEO_CAROUSEL_WIDTH} overflow-hidden`}
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
