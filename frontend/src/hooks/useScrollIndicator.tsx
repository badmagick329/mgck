import { useCallback, useEffect, useState } from 'react';

export default function useScrollIndicator() {
  const [scrollPercentage, setScrollPercentage] = useState(0);

  const onScroll = useCallback(() => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight =
      document.documentElement.scrollHeight -
      document.documentElement.clientHeight;
    const scrollPercentage = (scrollTop / scrollHeight) * 100;
    setScrollPercentage(scrollPercentage);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return scrollPercentage;
}
