// MovingEmoji.tsx
'use client';
import { useEffect, useState } from 'react';

// Define four corners relative to the parent container.
const corners = [
  { top: '0%', left: '0%' }, // top-left
  { top: '0%', left: '100%' }, // top-right
  { top: '100%', left: '0%' }, // bottom-left
  { top: '100%', left: '100%' }, // bottom-right
];

// Utility to pick a random corner index (excluding the current one)
function getRandomCornerIndex(exclude?: number) {
  let idx = Math.floor(Math.random() * corners.length);
  while (idx === exclude) {
    idx = Math.floor(Math.random() * corners.length);
  }
  return idx;
}

export default function MovingEmoji() {
  const [currentCorner, setCurrentCorner] = useState(0);
  const [targetCorner, setTargetCorner] = useState(getRandomCornerIndex(0));
  const [isMoving, setIsMoving] = useState(true);

  function handleTransitionEnd() {
    setIsMoving(false);

    setTimeout(() => {
      setCurrentCorner(targetCorner);
      setTargetCorner(getRandomCornerIndex(targetCorner));
      setIsMoving(true);
    }, 3000);
  }

  useEffect(() => {
    const cancelTimer = setInterval(() => {
      setTargetCorner(getRandomCornerIndex(currentCorner));
    }, 3000);
    return () => clearInterval(cancelTimer);
  }, []);

  const fromCorner = corners[currentCorner];
  const toCorner = corners[targetCorner];
  console.log(`is moving ${isMoving} from ${currentCorner} to ${targetCorner}`);

  return (
    <div className='absolute inset-0 z-0 overflow-hidden'>
      <div
        onTransitionEnd={handleTransitionEnd}
        className='absolute text-6xl transition-all duration-10000 ease-linear'
        style={{
          top: isMoving ? toCorner.top : fromCorner.top,
          left: isMoving ? toCorner.left : fromCorner.left,
          opacity: isMoving ? 1 : 0,
          transform: 'translate(-50%, -50%)',
        }}
      >
        🤩
      </div>
    </div>
  );
}
