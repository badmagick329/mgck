'use client';
import { Textarea } from '@/components/ui/textarea';
import { useEmojifyContext } from '@/app/emojify/_context/store';
import { useEffect, useRef, useState } from 'react';

export default function MessageField() {
  const {
    messageInput,
    setMessageInput,
    messageInputTextAreaRows,
    setMessageInputTextAreaRows,
  } = useEmojifyContext();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || !textAreaRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const target = entry.target as HTMLTextAreaElement;
        const style = window.getComputedStyle(target);
        const lineHeight = parseFloat(style.lineHeight) || 5;
        const rowCount = Math.floor(target.clientHeight / lineHeight);

        setMessageInputTextAreaRows(rowCount);
      }
    });

    observer.observe(textAreaRef.current);

    return () => {
      observer.disconnect();
    };
  }, [mounted, setMessageInputTextAreaRows]);

  if (!mounted) {
    return null;
  }

  return (
    <section className='pb-2'>
      <Textarea
        ref={textAreaRef}
        className='bg-background-em-dark/10 dark:bg-background-em-dark rounded-md p-2 z-10'
        onChange={(e) => setMessageInput(e.target.value)}
        placeholder='Enter your message here'
        value={messageInput}
        rows={messageInputTextAreaRows}
      />
    </section>
  );
}
