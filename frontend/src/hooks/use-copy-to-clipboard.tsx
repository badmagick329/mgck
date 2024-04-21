import { useCallback } from "react";

export type CopyFn = (text: string) => Promise<boolean>;

export function useCopyToClipboard(): CopyFn {
  const copy: CopyFn = useCallback(async (text) => {
    if (!navigator?.clipboard) {
      console.warn("Clipboard not supported");
      return false;
    }

    try {
      await copyToClipboard(text);
      return true;
    } catch (error) {
      console.warn("Copy failed", error);
      return false;
    }
  }, []);

  return copy;
}

async function copyToClipboard(textToCopy: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(textToCopy);
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = textToCopy;
    textArea.style.position = "absolute";
    textArea.style.left = "-999999px";
    document.body.prepend(textArea);
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (error) {
      console.error(error);
    } finally {
      textArea.remove();
    }
  }
}
