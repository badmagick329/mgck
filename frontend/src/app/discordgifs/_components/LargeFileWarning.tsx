'use client';

import { useEffect, useState } from 'react';
import { inputMemoryLimits } from '@/lib/consts/discordgifs';
import { formatBytes } from '@/lib/discordgifs/advanced';

/**
 * FFmpeg reads the whole input into browser memory before converting, so a
 * file past what the device can hold fails only after a long wait. Phones
 * hold far less than desktops; a coarse pointer is the available hint.
 */
export default function LargeFileWarning({ file }: { file: File }) {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    setPhone(window.matchMedia?.('(pointer: coarse)').matches ?? false);
  }, []);
  const limit = phone ? inputMemoryLimits.phone : inputMemoryLimits.desktop;
  if (file.size <= limit.bytes) return null;
  return (
    <p
      role='alert'
      className='rounded-md border border-amber-500/70 bg-amber-950/30 px-3 py-2 text-left text-xs leading-relaxed text-amber-100'
    >
      This file is {formatBytes(file.size)}. Converting loads all of it into
      browser memory, and{' '}
      {phone
        ? `files over ${limit.label} often fail on phones.`
        : `browsers can't load files much over ${limit.label}.`}{' '}
      A shorter or smaller copy of the clip will convert more reliably.
    </p>
  );
}
