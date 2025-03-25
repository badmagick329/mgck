import { Button } from '@/components/ui/button';
import { URL_SHORTENER_BASE } from '@/lib/consts/urls';
import Link from 'next/link';

export default function UrlShortenerIntro() {
  return (
    <div className='grid place-content-center place-items-center gap-8 border-t-2 border-primary-kp bg-background-kp px-8 py-4 sm:px-12 sm:py-6'>
      <span className='text-lg'>Shorten URLs and get usage data</span>
      <Link href={URL_SHORTENER_BASE}>
        <Button className='w-72 bg-primary-kp/70 font-semibold text-primary-foreground shadow-glow-primary-kp hover:bg-primary-kp md:w-96 md:text-lg'>
          Shorten URL
        </Button>
      </Link>
    </div>
  );
}
