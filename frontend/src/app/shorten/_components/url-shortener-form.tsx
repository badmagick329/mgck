'use client';

import { shortenUrl } from '@/actions/urlshortener';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function UrlShortenerForm() {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  return (
    <div className='flex flex-col items-center gap-4'>
      <span className='text-xl font-semibold md:text-2xl'>URL Shortener</span>
      <span className='text-red-500'>{error}</span>
      <form
        className='flex flex-col items-center gap-4 md:w-96'
        action={async () => {
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
        }}
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
      {output && (
        <div className='flex items-center justify-center gap-4'>
          <span className='md:text-xl'>Shortened URL 👉</span>
          <Button
            className='font-semibold text-green-500 md:text-xl'
            variant='link'
          >
            {output}
          </Button>
        </div>
      )}
    </div>
  );
}
