'use client';
import { useState, useEffect } from 'react';
import { randomBetween, randomChoice } from '@/lib/utils';

export default function RotatingEmojis({ emojis }: { emojis: string[] }) {
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null);

  useEffect(() => {
    setCurrentEmoji(randomChoice(emojis));

    const interval = window.setInterval(() => {
      setCurrentEmoji(randomChoice(emojis));
    }, randomBetween(500, 1500));

    return () => window.clearInterval(interval);
  }, [emojis]);

  return <span>{currentEmoji}</span>;
}
