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
  const [open, setOpenState] = useState(false);
  const [isDeleteDisabled, setIsDeleteDisabled] = useState(false);
  const [deleteError, setDeleteError] = useState('');
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
      const result = await deleteShortenedUrl({
        code: shortCode,
      });
      if (result.error) {
        setDeleteError(result.error);
        return false;
      }
      setDeleteError('');
      const match = createdUrlOutput.match(/(?:.+\/)(.+)/);
      if (!match) {
        return true;
      }
      const idFromUrl = match[1];
      if (idFromUrl === shortCode) {
        setCreatedUrlOutput('');
      }
      return true;
    } finally {
      setIsDeleteDisabled(false);
    }
  };

  // A reopened dialog starts clean; a failure from an earlier attempt is stale.
  const setOpen = (next: boolean) => {
    setOpenState(next);
    setDeleteError('');
  };

  return {
    open,
    setOpen,
    keyboardOffset,
    isDeleteDisabled,
    deleteError,
    handleDelete,
  };
}
