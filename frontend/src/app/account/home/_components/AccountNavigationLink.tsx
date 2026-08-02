'use client';

import { LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';

export default function AccountNavigationLink({
  href,
  children,
  className,
  loadingLabel = 'Loading…',
}: {
  href: string;
  children: ReactNode;
  className?: string;
  loadingLabel?: string;
}) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <button
      type='button'
      disabled={isNavigating}
      aria-busy={isNavigating}
      className={className}
      onClick={() => {
        if (isNavigating) return;
        setIsNavigating(true);
        router.push(href);
      }}
    >
      {isNavigating ? (
        <>
          <LoaderCircle className='size-4 animate-spin' aria-hidden='true' />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}
