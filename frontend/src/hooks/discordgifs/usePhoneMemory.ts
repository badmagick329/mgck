'use client';

import { useEffect, useState } from 'react';

/**
 * Whether to assume a phone's memory. Browsers don't say how much memory a
 * tab may use, and phones hold far less than desktops; a coarse pointer is
 * the available hint. False until mounted, so server and first render agree.
 */
export function usePhoneMemory(): boolean {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    setPhone(window.matchMedia?.('(pointer: coarse)').matches ?? false);
  }, []);
  return phone;
}
