import { Checkbox } from '@/components/ui/checkbox-dg';
import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegFileData, FFmpegFileDataOutput } from '@/lib/types';
import { capitaliseWords, truncateText } from '@/lib/utils';
import clsx from 'clsx';
import Image from 'next/image';

import OutputPlaceholder from './output-placeholder';
import ProgressBar from './progress-bar';

const targetChoices = Object.keys(sizeInfo) as Array<keyof typeof sizeInfo>;

type ConvertedFileProps = {
  fileData: FFmpegFileData;
  setOutputTypes: (targets: Array<keyof typeof sizeInfo>) => void;
};

export default function ConvertedFile({
  fileData,
  setOutputTypes,
}: ConvertedFileProps) {
  const {
    file,
    outputs,
    outputTypes,
    progress,
    currentTarget: target,
    size,
    conversionState,
  } = fileData;
  if (!file) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex min-h-80 min-w-72 flex-col items-center',
        'gap-4 rounded-md px-2 py-4',
        'bg-secondaryDg shadow-glowSecondaryDg'
      )}
    >
      <p>{truncateText(file.name, 28)}</p>
      <ProgressBar
        target={target}
        current={size}
        iterationProgress={progress}
        conversionState={conversionState}
      />
      <div className='flex gap-16'>
        {targetChoices.map((choice, idx) => {
          const key = `${file.name}-${choice}`;
          return (
            <div className='flex items-center gap-2' key={key}>
              <Checkbox
                id={key}
                checked={outputTypes.includes(choice)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setOutputTypes([...outputTypes, choice]);
                  } else {
                    setOutputTypes(outputTypes.filter((t) => t !== choice));
                  }
                }}
                disabled={conversionState !== 'idle'}
              />
              <label
                htmlFor={key}
                className='text-sm font-medium leading-none hover:cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                {capitaliseWords(choice)}
              </label>
            </div>
          );
        })}
      </div>
      <div className='flex h-full w-full gap-4'>
        {outputs.length === 0 && <OutputPlaceholder />}
        {outputs.map((output) => (
          <ConversionOutput key={output.url} output={output} />
        ))}
      </div>
    </div>
  );
}

function ConversionOutput({ output }: { output: FFmpegFileDataOutput }) {
  const { url, name, finalSize, type } = output;
  const sizeText = finalSize ? `${(finalSize / 1024).toFixed(1)}KiB` : '';
  return (
    <div className='mt-4 flex flex-col items-center'>
      <a
        className='hover:text-primaryDg/80 flex flex-col items-center justify-center gap-2 rounded-md px-2 py-2 hover:bg-slate-600'
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
