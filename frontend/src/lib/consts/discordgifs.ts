import { ConversionPresetId } from '@/lib/discordgifs/conversion-target';

export const maxFiles = 6;

/**
 * Discord's upload limit for free accounts: 20 MB per file since August 2026
 * (Discord's File Attachments FAQ). Counted in decimal megabytes so the
 * warning errs early; Discord's UI has refused files near its stated caps.
 */
export const discordFreeUploadLimit = { bytes: 20 * 1000 * 1000, label: '20 MB' };

/**
 * Input sizes past which loading the clip into FFmpeg tends to fail.
 * Desktop: Chrome's FileReader, which `fetchFile` uses, reads nothing past
 * about 2 GiB (measured 2026-11-14; a 1.99 GiB file converted, 2.98 GiB did
 * not). Phone: not measured on a device. Loading holds the file about twice
 * (the read buffer and FFmpeg's in-memory copy) beside the core's own few
 * hundred MB, and mobile browsers end tabs at around 1 GB, so 250 MB keeps
 * the total well under that.
 */
export const inputMemoryLimits = {
  phone: { bytes: 250 * 1000 * 1000, label: '250 MB' },
  desktop: { bytes: 2 * 1000 * 1000 * 1000, label: '2 GB' },
};

/** Discord menu path where each downloaded output is installed. */
export const discordUploadSteps: Record<ConversionPresetId, string> = {
  emote: 'Server Settings → Emoji → Upload Emoji',
  sticker: 'Server Settings → Stickers → Upload Sticker',
  avatar: 'User Settings → Profiles → Change Avatar',
};

/**
 * Pixel boxes Discord's desktop client draws each output in, so people judge
 * legibility at the size others will see rather than at the source size.
 */
export const discordDisplayPx = {
  sticker: 160,
  inlineEmoji: 22,
  jumboEmoji: 48,
  chatAvatar: 40,
  profileAvatar: 80,
} as const;

// People who drag the APNG into a chat expect a sticker and get a plain image,
// so the upload help states the difference wherever it names the sticker step.
export const stickerAttachmentNote =
  'Sending the file in a message posts a plain image, not a sticker.';

export const acceptedImageTypes = ['.gif'];

export const acceptedVideoTypes = [
  '.mp4',
  '.mkv',
  '.webm',
  '.mov',
  '.avi',
  '.flv',
  '.ts',
  '.m4v',
];

export const acceptedTypes = {
  'image/*': acceptedImageTypes,
  'video/*': acceptedVideoTypes,
};
