import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegFileData } from '@/lib/types';
import { truncateText } from '@/lib/utils';
import clsx from 'clsx';

import ChoiceCheckbox from './choice-checkbox';
import ConversionOutput from './conversion-output';
import OutputPlaceholder from './output-placeholder';
import ProgressBar from './progress-bar';

const targetChoices = Object.keys(sizeInfo) as Array<keyof typeof sizeInfo>;

type SizeInfoKey = keyof typeof sizeInfo;

type ConvertedFileProps = {
  fileData: FFmpegFileData;
  setOutputTypes: (targets: Array<SizeInfoKey>) => void;
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
    currentTarget,
    size,
    conversionState,
  } = fileData;
  if (!file) {
    return null;
  }

  return (
    <div
      className={clsx(
        'flex min-h-80 w-72 flex-col items-center gap-4 rounded-md px-2 py-4',
        'bg-secondaryDg shadow-glowSecondaryDg'
      )}
    >
      <p>{truncateText(file.name, 28)}</p>
      <ProgressBar
        target={currentTarget}
        current={size}
        iterationProgress={progress}
        conversionState={conversionState}
      />
      <div className='flex gap-16'>
        {targetChoices.map((choice, idx) => {
          const key = `${file.name}-${choice}`;
          return (
            <ChoiceCheckbox
              key={key}
              choice={choice}
              outputTypes={outputTypes}
              setOutputTypes={setOutputTypes}
              conversionState={conversionState}
            />
          );
        })}
      </div>
      <div className='flex h-full w-full items-center justify-center gap-4 border-2 border-white shadow-glowSecondaryDg'>
        {outputs.length === 0 && <OutputPlaceholder />}
        {outputs.map((output) => (
          <ConversionOutput key={output.url} output={output} />
        ))}
      </div>
    </div>
  );
}
