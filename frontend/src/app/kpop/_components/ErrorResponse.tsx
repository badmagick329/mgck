import { Button } from '@/components/ui/button';
import { KPOP_BASE } from '@/lib/consts/urls';
import { notFound } from 'next/navigation';

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
        <Button
          className='text-xl underline'
          variant='link'
          size='lg'
          onClick={() => (window.location.href = KPOP_BASE)}
        >
          Go back
        </Button>
      </div>
    );
  }
}
