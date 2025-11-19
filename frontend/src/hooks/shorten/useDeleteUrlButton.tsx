import { deleteShortenedUrl } from '@/actions/urlshortener';
import { useEffect, useState } from 'react';

export default function useDeleteUrlButton({
  shortCode,
  createdUrlOutput,
  setCreatedUrlOutput,
}: {
  shortCode: string;
  createdUrlOutput: string;
  setCreatedUrlOutput: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [open, setOpen] = useState(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
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

  const handleDelete = async () => {
    try {
      setIsDeleteDisabled(true);
      await deleteShortenedUrl({
        code: shortCode,
      });
      const match = createdUrlOutput.match(/(?:.+\/)(.+)/);
      if (!match) {
        return;
      }
      const idFromUrl = match[1];
      if (idFromUrl === shortCode) {
        setCreatedUrlOutput('');
      }
    } finally {
      setIsDeleteDisabled(false);
    }
  };

  return {
    open,
    setOpen,
    keyboardOffset,
    isDeleteDisabled,
    handleDelete,
  };
}
