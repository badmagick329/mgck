'use client';

import { useEffect, useState } from 'react';
import { useEmojifyContext } from '@/app/emojify/_context/store';

export default function EmojifyHelpText({ aiEnabled }: { aiEnabled: boolean }) {
  const [mounted, setMounted] = useState(false);
  const { showHelp } = useEmojifyContext();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !showHelp) {
    return null;
  }

  return (
    <ul className='bg-background-em-dark/60 grid grid-cols-1 gap-1 p-4 rounded-md list-disc list-inside content-start'>
      <abbr className='no-underline' title='Help Section'>
        <li>Emojis will be picked from the above list at random.</li>
        <li>You can edit it and it will be saved in your browser.</li>
        <li>Use reset to bring back default list.</li>
        {aiEnabled && (
          <li>Alternativey use AI to generate the appropriate emojis.</li>
        )}
      </abbr>
    </ul>
  );
}
