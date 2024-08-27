import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 950;

export default function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isDesktopOrLandscape, setIsDesktopOrLandscape] = useState(false);

  useEffect(() => {
    function handleResize() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsDesktopOrLandscape(
      size.width > MOBILE_BREAKPOINT && size.height < size.width
    );
  }, [size]);

  return { size, isDesktopOrLandscape };
}
