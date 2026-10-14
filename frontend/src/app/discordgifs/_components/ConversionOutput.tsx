import {
  discordUploadSteps,
  stickerAttachmentNote,
} from '@/lib/consts/discordgifs';
import { conversionPresetLabels } from '@/lib/discordgifs/conversion-target';
import { FFmpegFileDataOutput } from '@/lib/types/discordgifs';

import DiscordPreview from './DiscordPreview';

export default function ConversionOutput({
  output,
}: {
  output: FFmpegFileDataOutput;
}) {
  const { url, name, finalSize, type } = output;
  const label = conversionPresetLabels[type];
  if (url === '') {
    return (
      <p className='break-words font-semibold text-red-600'>
        {label} conversion failed
      </p>
    );
  }
  const sizeText = finalSize ? ` · ${(finalSize / 1024).toFixed(1)} KiB` : '';
  return (
    <div className='flex w-full flex-col gap-2'>
      <DiscordPreview type={type} url={url} />
      <a
        className='rounded-md bg-primary-dg px-3 py-2 text-center font-semibold hover:bg-primary-dg/80'
        href={url}
        download={name}
      >
        Download {label.toLowerCase()}
        {sizeText}
      </a>
      <p className='text-left text-xs text-foreground-dg/80'>
        Add it in {discordUploadSteps[type]}.
        {type === 'sticker' && ` ${stickerAttachmentNote}`}
      </p>
    </div>
  );
}
