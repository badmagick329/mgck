import { useEffect, useState } from 'react';

export default function useKeyboardOffset() {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const offset = (window.innerHeight - viewport.height) / 2;
      setKeyboardOffset(offset);
    };

    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  return {
    keyboardOffset,
  };
}
