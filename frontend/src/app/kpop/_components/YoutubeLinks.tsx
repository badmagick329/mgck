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
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import CarouselButtons from './CarouselButtons';
import YoutubePlayer from './YoutubePlayer';

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
      className={`flex w-full justify-center`}
    >
      <div className='flex w-full flex-col justify-center gap-4 py-1'>
        <CollapsibleTrigger asChild>
          <div className='flex justify-center gap-2 text-xs font-bold hover:cursor-pointer'>
            <span>{toggleText}</span>
            {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className='space-y-2'>
          <Carousel
            setApi={setCarouselApi}
            opts={{
              align: 'center',
              loop: true,
            }}
            orientation='horizontal'
            className='3xs:px-1 2xs:px-6 xs:px-10'
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
