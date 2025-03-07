import { sizeInfo } from '@/lib/ffmpeg-utils/frame-size-calculator';
import { FFmpegFileData } from '@/lib/types/ffmpeg';
import { truncateText } from '@/lib/utils';
import clsx from 'clsx';

import ChoiceCheckbox from './ChoiceCheckbox';
import ConversionOutput from './ConversionOutput';
import OutputPlaceholder from './OutputPlaceholder';
import ProgressBar from './ProgressBar';

const targetChoices = Object.keys(sizeInfo) as Array<keyof typeof sizeInfo>;

type SizeInfoKey = keyof typeof sizeInfo;

type ConvertedFileProps = {
  fileData: FFmpegFileData;
  setOutputTypes: (targets: Array<SizeInfoKey>) => void;
  buttonsEnabled: boolean;
};

export default function ConvertedFile({
  fileData,
  setOutputTypes,
  buttonsEnabled,
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
        'bg-secondary-dg shadow-glow-secondary-dg'
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
              checkboxId={key}
              choice={choice}
              outputTypes={outputTypes}
              setOutputTypes={setOutputTypes}
              buttonsEnabled={buttonsEnabled}
            />
          );
        })}
      </div>
      <div className='flex h-full w-full items-center justify-center gap-4 border-2 border-orange-500/40'>
        {outputs.length === 0 && <OutputPlaceholder />}
        {outputs.map((output) => (
          <ConversionOutput key={output.url} output={output} />
        ))}
      </div>
    </div>
  );
}
