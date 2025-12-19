'use client';

import { useEffect, useState } from 'react';

export default function Tztest() {
  const [isLoaded, setIsLoaded] = useState(false);
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  if (!isLoaded) {
    return null;
  }
  return (
    <div className='flex flex-col items-center gap-4 pt-8'>
      <p>TZ: {Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
      <p>Datetime ISO string: {new Date().toISOString()}</p>
      <p>Datetime timestring: {new Date().getTime()}</p>
    </div>
  );
}
