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
    <Button variant={'plain'} onClick={toggleHelp}>
      {buttonText}
    </Button>
  );
}
