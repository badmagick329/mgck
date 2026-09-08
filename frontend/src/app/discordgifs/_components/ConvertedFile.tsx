import VideoTrimmer from './VideoTrimmer';
import { ClipCrop, ClipTrim, FFmpegFileData } from '@/lib/types/discordgifs';
import {
  conversionPresetLabels,
  conversionTargetPresets,
} from '@/lib/discordgifs/conversion-target';
import { getFileOutputEligibility } from '@/lib/discordgifs/eligibility';
import { truncateText } from '@/lib/utils';
import clsx from 'clsx';

import ConversionOutput from './ConversionOutput';
import ProgressBar from './ProgressBar';
import { IoIosCloseCircle } from 'react-icons/io';

type ConvertedFileProps = {
  fileData: FFmpegFileData;
  removeFile: () => void;
  disabled?: boolean;
  onConvert: () => void;
  onTrimChange: (trim: ClipTrim | undefined) => void;
  onCropChange: (crop: ClipCrop | undefined) => void;
};

export default function ConvertedFile({
  fileData,
  removeFile,
  disabled = false,
  onTrimChange,
  onCropChange,
  onConvert,
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
        'flex min-h-80 w-full max-w-md flex-col items-center gap-4 rounded-md px-2 pb-4 pt-2',
        'bg-secondary-dg shadow-glow-secondary-dg'
      )}
    >
      <div className='flex w-full flex-col'>
        <button
          className='self-end text-foreground/80 hover:text-foreground'
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          onClick={removeFile}
        >
          <IoIosCloseCircle />
        </button>
        <p>{truncateText(file.name, 28)}</p>
      </div>
      {conversionState === 'idle' && (
        <VideoTrimmer
          fileData={fileData}
          disabled={disabled}
          onChange={onTrimChange}
          onCropChange={onCropChange}
        />
      )}
      {conversionState !== 'idle' && (
        <ProgressBar
          target={currentTarget}
          current={size}
          iterationProgress={progress}
          conversionState={conversionState}
        />
      )}
      {stickerIsExcluded &&
        fileData.duration.status === 'known' &&
        stickerLimit !== undefined && (
          <div
            role='alert'
            className='rounded-md border border-amber-500/70 bg-amber-950/30 px-3 py-2 text-left text-xs leading-relaxed text-amber-100'
          >
            <p>
              This selection is{' '}
              {formatDuration(
                fileData.trim
                  ? fileData.trim.end - fileData.trim.start
                  : fileData.duration.seconds
              )}{' '}
              long; Stickers are limited to {stickerLimit} seconds. Choose a
              shorter segment above to include Sticker.
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
      {conversionState === 'idle' && (
        <button
          type='button'
          className='mt-auto w-full rounded-md bg-primary-dg px-4 py-3 font-semibold hover:bg-primary-dg/80 disabled:cursor-not-allowed disabled:opacity-50'
          disabled={
            disabled ||
            fileData.duration.status === 'checking' ||
            eligibleOutputTypes.length === 0
          }
          onClick={onConvert}
        >
          {fileData.outputTypes.length === 1 &&
          fileData.outputTypes[0] === 'sticker'
            ? 'Create sticker'
            : 'Convert clip'}
        </button>
      )}
      {outputs.length > 0 && (
        <div className='flex h-full w-full items-center justify-center gap-4 border-2 border-orange-500/40'>
          {outputs.map((output) => (
            <ConversionOutput key={output.url} output={output} />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDuration(seconds: number): string {
  const rounded = Math.round(seconds * 10) / 10;
  return `${rounded.toFixed(Number.isInteger(rounded) ? 0 : 1)} seconds`;
}
