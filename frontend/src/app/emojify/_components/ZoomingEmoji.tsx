'use client';

import { DEFAULT_EMOJIS } from '@/lib/consts/emojify';
import { useEffect, useState } from 'react';

const randomCorner = (index: number) => {
  const corners = [
    { top: 0, left: 0 },
    { top: 100, left: 100 },
    { top: 0, left: 100 },
    { top: 100, left: 0 },
  ];
  let newIndex = index;
  while (newIndex === index) {
    newIndex = Math.floor(Math.random() * corners.length);
  }
  return corners[newIndex];
};

const randomEmoji = () =>
  DEFAULT_EMOJIS[Math.floor(Math.random() * DEFAULT_EMOJIS.length)];

export default function ZoomingEmoji({
  probability = 1,
}: {
  probability: number;
}) {
  const [index, setIndex] = useState(Math.floor(Math.random() * 4));
  const [corner, setCorner] = useState(randomCorner(index));
  const [currentEmoji, setCurrentEmoji] = useState<string | null>(null);
  const [showComponent, setShowComponent] = useState(
    Math.random() < probability
  );
  const [duration, setDuration] = useState(5000);

  const [reverseAnimate] = useState(() => Math.random() < 0.5);

  useEffect(() => {
    setCurrentEmoji(randomEmoji());
    const moveInterval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * 4);
      setIndex(newIndex);
      setCorner(randomCorner(newIndex));
      setCurrentEmoji(randomEmoji());
      setShowComponent(Math.random() < probability);
      setDuration(Math.floor(Math.random() * 5000) + 5000);
    }, duration);

    return () => clearInterval(moveInterval);
  }, [probability, duration]);

  const { top, left } = corner;

  if (!showComponent || !currentEmoji) {
    return null;
  }

  return (
    <div
      className='absolute inset-0 z-0 select-none'
      style={{
        top: `${top}%`,
        left: `${left}%`,
        transition: `top ${duration / 1000}s linear, left ${
          duration / 1000
        }s linear`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div
        className='text-6xl animate-rotate-fade'
        style={{
          animationDirection: reverseAnimate ? 'reverse' : 'normal',
        }}
      >
        {currentEmoji}
      </div>
    </div>
  );
}
