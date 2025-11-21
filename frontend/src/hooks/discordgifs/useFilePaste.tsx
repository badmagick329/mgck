import { useEffect } from 'react';
import {
  acceptedImageTypes,
  acceptedVideoTypes,
} from '@/lib/consts/discordgifs';

export function useFilePaste(onFilesPasted: (files: File[]) => void) {
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const pastedItems = event.clipboardData?.items;
      if (!pastedItems) return;

      const fileItems: File[] = [];

      for (let i = 0; i < pastedItems.length; i++) {
        const item = pastedItems[i];

        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            const fileExtension = `.${file.name.split('.').pop()}`;
            const isAcceptedType = [
              ...acceptedImageTypes,
              ...acceptedVideoTypes,
            ].includes(fileExtension);

            if (
              isAcceptedType &&
              (file.type.startsWith('image/') || file.type.startsWith('video/'))
            ) {
              fileItems.push(file);
            }
          }
        }
      }

      if (fileItems.length > 0) {
        onFilesPasted(fileItems);
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [onFilesPasted]);
}
