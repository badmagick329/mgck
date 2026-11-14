import { SessionResult } from '@/lib/types/discordgifs';
import { fileTypeInfo, formatBytes } from '@/lib/discordgifs/advanced';
import { discordFreeUploadLimit } from '@/lib/consts/discordgifs';

/**
 * Gif Studio's *Made this session* list. Downloads only: a browser can't put
 * a file on the clipboard or open a folder, so its Copy and Show buttons
 * don't carry over.
 */
export default function SessionResults({
  results,
}: {
  results: readonly SessionResult[];
}) {
  return (
    <section aria-labelledby='session-results' className='flex flex-col gap-2'>
      <h3 id='session-results' className='text-sm font-semibold'>
        Made this session
      </h3>
      {results.length === 0 ? (
        <p className='text-sm text-foreground-dg/60'>
          Nothing yet. Your files show up here.
        </p>
      ) : (
        <ul className='flex flex-col gap-2'>
          {results.map((result) => (
            <li
              key={result.id}
              className='flex items-center gap-3 rounded-md border border-foreground-dg/15 p-2'
            >
              <ResultRow result={result} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ResultRow({ result }: { result: SessionResult }) {
  const label = fileTypeInfo[result.fileType].label;
  if ('failed' in result) {
    return (
      <p className='text-sm font-semibold text-red-500'>
        {label} conversion failed
      </p>
    );
  }
  const overLimit = result.size > discordFreeUploadLimit.bytes;
  return (
    <>
      <div className='grid h-14 w-20 shrink-0 place-items-center overflow-hidden rounded bg-black'>
        {result.fileType === 'mp4' ? (
          <video
            src={result.url}
            aria-label={`${label} preview`}
            className='max-h-full max-w-full'
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- a blob URL Next can't optimise
          <img
            src={result.url}
            alt={`${label} preview`}
            className='max-h-full max-w-full'
          />
        )}
      </div>
      <div className='flex min-w-0 grow flex-col gap-1 text-left'>
        <p className='truncate text-sm' title={result.name}>
          {result.name}
        </p>
        <p className='text-xs text-foreground-dg/70'>
          <span className='font-semibold text-foreground-dg'>{label}</span> ·{' '}
          <span className={overLimit ? 'text-amber-300' : undefined}>
            {formatBytes(result.size)}
          </span>
          {overLimit &&
            ` · over Discord's ${discordFreeUploadLimit.label} free upload limit`}
        </p>
      </div>
      <a
        className='shrink-0 rounded-md bg-primary-dg px-3 py-1.5 text-sm font-semibold hover:bg-primary-dg/80'
        href={result.url}
        download={result.name}
        aria-label={`Download ${result.name}`}
      >
        Download
      </a>
    </>
  );
}
