'use client';

import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useEmojifyContext } from '@/app/emojify/_context/store';

export default function EmojifyHelpButton() {
  const { showHelp, toggleHelp } = useEmojifyContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) {
    return null;
  }
  const buttonText = showHelp ? 'Hide Help' : 'Show Help';

  return (
    <abbr
      className='no-underline justify-self-start'
      title={`${buttonText} section`}
    >
      <Button variant={'plain'} className='py-0 px-2 h-6' onClick={toggleHelp}>
        {buttonText}
      </Button>
    </abbr>
  );
}
