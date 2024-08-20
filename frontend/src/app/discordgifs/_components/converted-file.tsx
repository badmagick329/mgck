import { Checkbox } from '@/components/ui/checkbox';
import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegFileData, FFmpegFileDataOutput } from '@/lib/types';
import Image from 'next/image';

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
    <div className='flex min-h-24 w-full flex-col items-center justify-center gap-4 rounded-md border-2 border-white px-2 py-4'>
      <p>{file.name}</p>
      <ProgressBar
        target={target}
        current={size}
        iterationProgress={progress}
        conversionState={conversionState}
      />
      <div className='flex gap-2'>
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
                className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
              >
                {choice}
              </label>
            </div>
          );
        })}
      </div>
      <div className='flex gap-4'>
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
    <div className='flex flex-col items-center'>
      <a
        className='flex flex-col items-center justify-center gap-2 rounded-md px-2 py-2 hover:bg-slate-600 hover:text-primary/80'
        href={url}
        download={name}
      >
        <p className='text-sm'>{sizeText}</p>
        <Image
          className='rounded-md'
          src={url}
          width={80}
          height={80}
          alt={name}
        />
        <p className='text-xs'>Download {type}</p>
      </a>
    </div>
  );
}
