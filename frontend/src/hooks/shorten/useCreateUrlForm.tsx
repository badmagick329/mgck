import { createShortenedUrl } from '@/actions/urlshortener';
import { ChangeEvent, useEffect, useState } from 'react';

const MAX_CODE_CHARS = 255;

export default function useCreateUrlForm({
  setError,
  setOutput,
}: {
  setError: React.Dispatch<React.SetStateAction<string>>;
  setOutput: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [url, setUrl] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [codeCountText, setCodeCountText] = useState('');

  useEffect(() => {
    if (customCode === '') {
      setCodeCountText(`Max custom code length: ${MAX_CODE_CHARS}`);
      return;
    }
    const remainingChars = MAX_CODE_CHARS - customCode.length;
    setCodeCountText(`${remainingChars}/${MAX_CODE_CHARS}`);
  }, [customCode]);

  async function submitForm() {
    const result = await createShortenedUrl({ url, customCode });

    if (result.error) {
      setError(result.error);
      return;
    }
    if (!result.url) {
      setError('Failed to shorten URL');
      return;
    }
    setError('');
    setUrl('');
    setOutput(result.url);
  }

  return {
    submitForm,
    handleUrlInputChange: (e: ChangeEvent<HTMLInputElement>) => {
      setUrl(e.target.value.trim());
      setError('');
    },
    handleCodeInputChange: (e: ChangeEvent<HTMLInputElement>) => {
      setCustomCode(e.target.value.trim());
      setError('');
    },
    url,
    customCode,
    codeCountText,
  };
}
