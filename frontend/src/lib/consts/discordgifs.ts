import { ConversionPresetId } from '@/lib/discordgifs/conversion-target';

export const maxFiles = 6;

/** Discord menu path where each downloaded output is installed. */
export const discordUploadSteps: Record<ConversionPresetId, string> = {
  emote: 'Server Settings → Emoji → Upload Emoji',
  sticker: 'Server Settings → Stickers → Upload Sticker',
  avatar: 'User Settings → Profiles → Change Avatar',
};

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
