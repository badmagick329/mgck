import { Button } from '@/components/ui/button';
import { CarouselApi } from '@/components/ui/carousel';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CarouselButtons({
  carouselApi,
  count,
  current,
}: {
  carouselApi: CarouselApi;
  count: number;
  current: number;
}) {
  if (!carouselApi || count < 2) {
    return null;
  }
  return (
    <div className='flex justify-between pt-2'>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => carouselApi?.scrollPrev()}
        disabled={!carouselApi.canScrollPrev()}
      >
        <ChevronLeft />
      </Button>
      <span>
        {current} / {count}
      </span>
      <Button
        variant='ghost'
        size='icon'
        onClick={() => carouselApi?.scrollNext()}
        disabled={!carouselApi.canScrollNext()}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
