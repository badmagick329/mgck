import { useGfyContext } from '@/app/gfys/_context/store';
import { isShortcutBlocked } from '@/lib/gfys/keyboard';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

export default function useSearchNavigation({
  onClient,
}: {
  onClient: boolean;
}) {
  const { data } = useGfyContext();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pathname = usePathname();
  const leftRef = useRef<HTMLAnchorElement>(null);
  const rightRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!onClient) {
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isShortcutBlocked(e)) {
        return;
      }
      if (e.key === 'ArrowLeft' || e.key === 'h') {
        leftRef.current?.click();
      } else if (e.key === 'ArrowRight' || e.key === 'l') {
        rightRef.current?.click();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (data.next) {
      const url = new URL(data.next);
      const page = url.searchParams.get('page');
      if (page) {
        setCurrentPage(parseInt(page) - 1);
      }
    } else if (data.previous) {
      const url = new URL(data.previous);
      const page = url.searchParams.get('page');
      if (page) {
        setCurrentPage(parseInt(page) + 1);
      }
    }
  }, [data]);

  return {
    data,
    leftRef,
    rightRef,
    pathname,
    currentPage,
  };
}
