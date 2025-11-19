'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { ShortenedUrl } from '@/lib/types/shorten';
import ResponseOutput from './ResponseOutput';
import Navbar from '@/app/_components/Navbar';
import Footer from '@/app/_components/Footer';
import ShortenedUrlsDisplay from './ShortenedUrlsDisplay';
import useCreateUrlForm from '@/hooks/shorten/useCreateUrlForm';

export default function UrlShortenerPage({
  shortenedUrls,
}: {
  shortenedUrls: ShortenedUrl[] | null;
}) {
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');

  return (
    <main className='flex min-h-screen flex-col'>
      <header>
        <Navbar />
      </header>
      <article className='flex grow flex-col flex-wrap items-center gap-4 px-4 pt-6'>
        <h1 className='text-xl font-semibold md:text-2xl'>URL Shortener</h1>
        <span className='text-red-500'>{error}</span>
        <CreateUrlForm setError={setError} setOutput={setOutput} />
        {output && <ResponseOutput output={output} />}
        <ShortenedUrlsDisplay
          urlsResponse={shortenedUrls}
          createdUrlOutput={output}
          setCreatedUrlOutput={setOutput}
        />
      </article>
      <Footer />
    </main>
  );
}

function CreateUrlForm({
  setError,
  setOutput,
}: {
  setError: React.Dispatch<React.SetStateAction<string>>;
  setOutput: React.Dispatch<React.SetStateAction<string>>;
}) {
  const {
    submitForm,
    handleUrlInputChange,
    handleCodeInputChange,
    url,
    customCode,
    codeCountText,
  } = useCreateUrlForm({
    setError,
    setOutput,
  });

  return (
    <form
      className='grid w-full grid-cols-1 gap-4 px-2 md:px-32 lg:px-64 xl:px-96'
      action={submitForm}
    >
      <abbr
        className='w-full no-underline'
        title='The URL you want to shorten.'
      >
        <Input
          placeholder='https://example.com'
          type='url'
          value={url}
          onChange={handleUrlInputChange}
        />
      </abbr>
      <div className='flex w-full flex-col items-center gap-1'>
        <abbr
          className='w-full no-underline'
          title='Valid characters are alphanumeric, underscores, and hyphens.'
        >
          <Input
            placeholder="Custom short code (Optional) e.g 'very-important-page'"
            type='text'
            value={customCode}
            onChange={handleCodeInputChange}
          />
        </abbr>
        <span className='self-end text-xs text-foreground/60 md:text-sm'>
          {codeCountText}
        </span>
      </div>
      <div className='mx-auto'>
        <Button
          className='bg-primary-kp/70 px-8 font-semibold text-primary-foreground shadow-glow-primary-kp hover:bg-primary-kp md:text-lg'
          type='submit'
        >
          Shorten
        </Button>
      </div>
    </form>
  );
}
