import { FFmpegFileData } from '@/lib/types/discordgifs';
import { truncateText } from '@/lib/utils';
import clsx from 'clsx';

import ConversionOutput from './ConversionOutput';
import OutputPlaceholder from './OutputPlaceholder';
import ProgressBar from './ProgressBar';
import { IoIosCloseCircle } from 'react-icons/io';

type ConvertedFileProps = {
  fileData: FFmpegFileData;
  removeFile: () => void;
};

export default function ConvertedFile({
  fileData,
  removeFile,
}: ConvertedFileProps) {
  const { file, outputs, progress, currentTarget, size, conversionState } =
    fileData;
  if (!file) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex min-h-80 w-72 flex-col items-center gap-4 rounded-md px-2 pb-4 pt-2',
        'bg-secondary-dg shadow-glow-secondary-dg'
      )}
    >
      <div className='flex w-full flex-col'>
        <button
          className='self-end text-foreground/80 hover:text-foreground'
          onClick={removeFile}
        >
          <IoIosCloseCircle />
        </button>
        <p>{truncateText(file.name, 28)}</p>
      </div>
      <ProgressBar
        target={currentTarget}
        current={size}
        iterationProgress={progress}
        conversionState={conversionState}
      />
      <div className='flex h-full w-full items-center justify-center gap-4 border-2 border-orange-500/40'>
        {outputs.length === 0 && <OutputPlaceholder />}
        {outputs.map((output) => (
          <ConversionOutput key={output.url} output={output} />
        ))}
      </div>
    </div>
  );
}
