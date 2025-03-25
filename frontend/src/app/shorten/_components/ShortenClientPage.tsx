'use client';

import { shortenUrl } from '@/actions/urlshortener';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEffect, useState } from 'react';
import { fetchAllUrls } from '@/actions/urlshortener';
import { ShortenedUrl } from '@/lib/types/shorten';
import ResponseOutput from './ResponseOutput';
import Navbar from '@/app/_components/Navbar';
import Footer from '@/app/_components/Footer';
import ShortenedUrlsDisplay from './ShortenedUrlsDisplay';

const MAX_CODE_CHARS = 255;

export default function UrlShortenerPage({ username }: { username: string }) {
  const [url, setUrl] = useState('');
  const [urlsResponse, setUrlsResponse] = useState<ShortenedUrl[] | null>([]);
  const [customCode, setCustomCode] = useState('');
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [codeCountText, setCodeCountText] = useState('');
  const [urlsResponseLoaded, setUrlsResponseLoaded] = useState(false);

  useEffect(() => {
    if (customCode.trim() === '') {
      setCodeCountText(`Max custom code length: ${MAX_CODE_CHARS}`);
      return;
    }
    const remainingChars = MAX_CODE_CHARS - customCode.length;
    setCodeCountText(`${remainingChars}/${MAX_CODE_CHARS}`);
  }, [customCode]);

  useEffect(() => {
    (async () => {
      await fetchUrlsResponse(username, setUrlsResponse, setUrlsResponseLoaded);
    })();
  }, []);

  async function submitForm() {
    const result = await shortenUrl({ url, customCode, username });

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
    await fetchUrlsResponse(username, setUrlsResponse, setUrlsResponseLoaded);
  }

  return (
    <main className='flex min-h-screen flex-col'>
      <header>
        <Navbar />
      </header>
      <article className='flex grow flex-col flex-wrap items-center gap-4 px-4 pt-6'>
        <h1 className='text-xl font-semibold md:text-2xl'>URL Shortener</h1>
        <span className='text-red-500'>{error}</span>
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
              onChange={(e) => {
                setUrl(e.target.value.trim());
                setError('');
              }}
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
                onChange={(e) => {
                  setCustomCode(e.target.value.trim());
                  setError('');
                }}
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
        {output && <ResponseOutput output={output} />}
        <ShortenedUrlsDisplay
          urlsResponse={urlsResponse}
          urlsResponseLoaded={urlsResponseLoaded}
        />
      </article>
      <Footer />
    </main>
  );
}

async function fetchUrlsResponse(
  username: string,
  setUrlsResponse: React.Dispatch<React.SetStateAction<ShortenedUrl[] | null>>,
  setUrlsResponseLoaded: React.Dispatch<React.SetStateAction<boolean>>
) {
  const result = await fetchAllUrls(username);
  result.urls ? setUrlsResponse(result.urls) : setUrlsResponse(null);
  setUrlsResponseLoaded(true);
}
