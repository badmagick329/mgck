'use client';

import { Button } from '@/components/ui/button';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function ThemeToggler() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <Button size='icon' variant='outline'></Button>;
  }

  if (resolvedTheme === 'dark') {
    return (
      <Button size='icon' variant='outline' onClick={() => setTheme('light')}>
        <Sun />
      </Button>
    );
  }

  return (
    <Button size='icon' variant='outline' onClick={() => setTheme('dark')}>
      <Moon />
    </Button>
  );
}
