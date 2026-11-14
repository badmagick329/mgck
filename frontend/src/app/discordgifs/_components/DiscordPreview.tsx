import { ConversionPresetId } from '@/lib/discordgifs/conversion-target';
import { discordDisplayPx } from '@/lib/consts/discordgifs';
import clsx from 'clsx';
import Image from 'next/image';

const {
  sticker: stickerPx,
  inlineEmoji: inlineEmojiPx,
  jumboEmoji: jumboEmojiPx,
  chatAvatar: chatAvatarPx,
  profileAvatar: profileAvatarPx,
} = discordDisplayPx;

export default function DiscordPreview({
  type,
  url,
}: {
  type: ConversionPresetId;
  url: string;
}) {
  return (
    <figure
      aria-label='Preview at Discord size'
      className='flex w-full flex-col gap-2 rounded-md bg-[#313338] p-3 text-left text-sm text-[#dbdee1]'
    >
      <figcaption className='text-xs text-[#949ba4]'>
        As shown in Discord
      </figcaption>
      {type === 'sticker' && <PreviewImage url={url} size={stickerPx} />}
      {type === 'emote' && (
        <>
          <p className='flex items-center gap-1'>
            gg <PreviewImage url={url} size={inlineEmojiPx} />
          </p>
          <PreviewImage url={url} size={jumboEmojiPx} />
        </>
      )}
      {type === 'avatar' && (
        <div className='flex items-center gap-4'>
          <PreviewImage url={url} size={chatAvatarPx} round />
          <PreviewImage url={url} size={profileAvatarPx} round />
        </div>
      )}
    </figure>
  );
}

function PreviewImage({
  url,
  size,
  round = false,
}: {
  url: string;
  size: number;
  round?: boolean;
}) {
  // Discord fits emoji and stickers inside a square box but crops avatars to a
  // circle, so non-square clips must preview the same way.
  return (
    <Image
      src={url}
      alt=''
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={clsx(round ? 'rounded-full object-cover' : 'object-contain')}
    />
  );
}
