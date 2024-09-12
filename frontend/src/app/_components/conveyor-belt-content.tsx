'use client';

import { useEffect, useState } from 'react';

export default function EmojiConveyorBelt({
  emojis,
  maxWidthInRem,
  maxHeightInRem: maxHeightInPerc,
  startingX,
  startingY,
  emojiDurationMs = 3000,
}: {
  emojis: string[];
  maxWidthInRem: number;
  maxHeightInRem: number;
  startingX: number;
  startingY: number;
  emojiDurationMs?: number;
}) {
  const [position, setPosition] = useState({
    x: startingX,
    y: startingY,
  });
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const [isDissolving, setIsDissolving] = useState(false);

  const calcNextPosition = (current: { x: number; y: number }) => {
    const { x, y } = current;
    if (x < maxWidthInRem && y <= -maxHeightInPerc) {
      return { x: x + 0.1, y };
    } else if (x >= maxWidthInRem && y < maxHeightInPerc) {
      return { x, y: y + 0.1 };
    } else if (x > -maxWidthInRem && y >= maxHeightInPerc) {
      return { x: x - 0.1, y };
    } else {
      return { x, y: y - 0.1 };
    }
  };

  useEffect(() => {
    const positionInterval = setInterval(() => {
      setPosition((current) => calcNextPosition(current));
    }, 33);

    const emojiInterval = setInterval(() => {
      setIsDissolving(true);
      setTimeout(() => {
        setCurrentEmojiIndex(Math.floor(Math.random() * emojis.length));
        setIsDissolving(false);
      }, 800);
    }, emojiDurationMs);

    return () => {
      clearInterval(positionInterval);
      clearInterval(emojiInterval);
    };
  }, [emojis, maxWidthInRem, maxHeightInPerc, emojiDurationMs]);

  return (
    <span
      style={{
        transform: `translate(${position.x * 16}px, ${position.y * 16}px)`,
        transition: 'opacity 0.8s ease-in-out',
        opacity: isDissolving ? 0 : 1,
      }}
      className='fixed text-xl'
    >
      {emojis[currentEmojiIndex]}
    </span>
  );
}
