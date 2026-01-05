import { useEffect, useState } from 'react';

export default function useKeyboardOffset() {
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const visualViewportCenter = viewport.offsetTop + viewport.height / 2;
      const layoutViewportCenter = window.innerHeight / 2;
      setKeyboardOffset(visualViewportCenter - layoutViewportCenter);
    };

    handleResize();
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  return {
    keyboardOffset,
  };
}
