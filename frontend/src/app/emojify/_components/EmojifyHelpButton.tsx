'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useEmojifyContext } from '@/app/emojify/_context/store';

export default function EmojifyHelpButton() {
  const { showHelp, toggleHelp } = useEmojifyContext();
  const [mounted, setMounted] = useState(false);
  let buttonText = '...';

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <abbr
        className='justify-self-start no-underline'
        title={`${buttonText} section`}
      >
        <Button variant={'plain'} className='h-6 px-2 py-0'>
          {buttonText}
        </Button>
      </abbr>
    );
  }

  buttonText = showHelp ? 'Hide Help' : 'Show Help';
  return (
    <abbr
      className='justify-self-start no-underline'
      title={`${buttonText} section`}
    >
      <Button variant={'plain'} className='h-6 px-2 py-0' onClick={toggleHelp}>
        {buttonText}
      </Button>
    </abbr>
  );
}
