import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { KPOP_BASE } from '@/lib/consts/urls';

export default function ErrorResponse({
  serverError,
}: {
  serverError: string;
}) {
  if (serverError === 'Page Not Found') {
    return notFound();
  } else {
    return (
      <div className='flex min-h-screen flex-col items-center gap-4 pt-24'>
        <span className='text-xl'>{serverError}</span>
        <Button className='text-xl underline' variant='link' size='lg' asChild>
          <Link href={KPOP_BASE}>Go back</Link>
        </Button>
      </div>
    );
  }
}
