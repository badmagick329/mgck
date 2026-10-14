import {
  discordUploadSteps,
  stickerAttachmentNote,
} from '@/lib/consts/discordgifs';
import {
  conversionPresetLabels,
  conversionPresetOrder,
  conversionTargetPresets,
} from '@/lib/discordgifs/conversion-target';

// Collapsed on purpose: a standing reference section below the converter was
// rejected twice for making the tool look secondary. Formats and size caps
// stay on the preset cards; this only covers what happens after download.
export default function DiscordUploadHelp() {
  return (
    <details className='w-full max-w-md text-sm text-foreground-dg/80'>
      <summary className='cursor-pointer text-center font-semibold'>
        Adding it to Discord
      </summary>
      <ul className='mt-2 flex flex-col gap-1 text-left'>
        {conversionPresetOrder.map((presetId) => (
          <li key={presetId}>
            <span className='font-semibold'>
              {conversionPresetLabels[presetId]}:
            </span>{' '}
            {discordUploadSteps[presetId]}.
            {presetId === 'sticker' &&
              ` Up to ${conversionTargetPresets.sticker.maxDurationSeconds} seconds. ${stickerAttachmentNote}`}
          </li>
        ))}
      </ul>
    </details>
  );
}
