import { FFmpegFileDataOutput } from '@/lib/types/ffmpeg';
import Image from 'next/image';

export default function ConversionOutput({
  output,
}: {
  output: FFmpegFileDataOutput;
}) {
  const { url, name, finalSize, type } = output;
  if (url === '') {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center'>
        <p className='break-words font-semibold text-red-600'>
          Conversion Failed
        </p>
      </div>
    );
  }
  const sizeText = finalSize ? `${(finalSize / 1024).toFixed(1)}KiB` : '';
  return (
    <div className='flex h-full w-full flex-col items-center justify-center'>
      <a
        className='flex flex-col items-center justify-center gap-2 rounded-md px-2 py-2 hover:bg-slate-600 hover:text-primary-dg/80'
        href={url}
        download={name}
      >
        <p className='text-sm'>{sizeText}</p>
        <Image
          className='rounded-md'
          src={url}
          width={60}
          height={60}
          alt={name}
        />
        <p className='text-xs'>Download {type}</p>
      </a>
    </div>
  );
}
