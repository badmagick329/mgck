'use client';

import { shortenUrl } from '@/actions/urlshortener';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

import ResponseOutput from './response-output';

export default function UrlShortenerForm() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  return (
    <div className='flex flex-col flex-wrap items-center gap-4 px-4'>
      <span className='text-xl font-semibold md:text-2xl'>URL Shortener</span>
      <span className='text-red-500'>{error}</span>
      <form
        className='flex flex-col flex-wrap items-center gap-4 md:w-96'
        action={() => submitForm(url, setUrl, setError, setOutput)}
      >
        <Input
          placeholder='https://example.com'
          type='url'
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setError('');
          }}
        />
        <Button type='submit'>Shorten</Button>
      </form>
      {output && <ResponseOutput output={output} />}
    </div>
  );
}

async function submitForm(
  url: string,
  setUrl: (url: string) => void,
  setError: (error: string) => void,
  setOutput: (output: string) => void
) {
  const result = await shortenUrl(url);

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
