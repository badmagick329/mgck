import { FFmpegFileData } from '@/lib/types/discordgifs';
import {
  conversionPresetLabels,
  conversionTargetPresets,
} from '@/lib/discordgifs/conversion-target';
import { getFileOutputEligibility } from '@/lib/discordgifs/eligibility';
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
  const { eligibleOutputTypes, excludedOutputTypes } =
    getFileOutputEligibility(fileData);
  const stickerLimit = conversionTargetPresets.sticker.maxDurationSeconds;
  const stickerIsExcluded = excludedOutputTypes.includes('sticker');
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
      {stickerIsExcluded &&
        fileData.duration.status === 'known' &&
        stickerLimit !== undefined && (
          <div
            role='alert'
            className='rounded-md border border-amber-500/70 bg-amber-950/30 px-3 py-2 text-left text-xs leading-relaxed text-amber-100'
          >
            <p>
              This clip is {formatDuration(fileData.duration.seconds)} long;
              Stickers are limited to {stickerLimit} seconds. Sticker will be
              skipped.
            </p>
            <p className='mt-1'>
              {eligibleOutputTypes.length > 0
                ? `Selected ${eligibleOutputTypes
                    .map((outputType) => conversionPresetLabels[outputType])
                    .join(' and ')} output${
                    eligibleOutputTypes.length === 1 ? '' : 's'
                  } can still be converted.`
                : 'There is nothing eligible to convert for this file while only Sticker is selected.'}
            </p>
          </div>
        )}
      <div className='flex h-full w-full items-center justify-center gap-4 border-2 border-orange-500/40'>
        {outputs.length === 0 && <OutputPlaceholder />}
        {outputs.map((output) => (
          <ConversionOutput key={output.url} output={output} />
        ))}
      </div>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10;
  return `${rounded.toFixed(Number.isInteger(rounded) ? 0 : 1)} seconds`;
}
