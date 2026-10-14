import '@testing-library/jest-dom';

import { fireEvent, render, screen, within } from '@testing-library/react';

import ConversionOutput from '@/app/discordgifs/_components/ConversionOutput';
import DiscordUploadHelp from '@/app/discordgifs/_components/DiscordUploadHelp';
import { FFmpegFileDataOutput } from '@/lib/types/discordgifs';

describe('Discord GIF Maker output', () => {
  test('previews a sticker at Discord chat size and explains installing it', () => {
    render(<ConversionOutput output={output('sticker', 'clip_sticker.png')} />);

    const preview = screen.getByRole('figure', {
      name: 'Preview at Discord size',
    });
    const image = within(preview).getByRole('presentation');
    expect(image).toHaveStyle({ width: '160px', height: '160px' });

    const download = screen.getByRole('link', {
      name: 'Download sticker · 400.0 KiB',
    });
    expect(download).toHaveAttribute('download', 'clip_sticker.png');
    expect(
      screen.getByText(/Server Settings → Stickers → Upload Sticker\./)
    ).toHaveTextContent('posts a plain image, not a sticker');
  });

  test('previews emoji inline and jumbo, and avatars cropped round', () => {
    const { unmount } = render(
      <ConversionOutput output={output('emote', 'clip_emote.gif')} />
    );
    const emoji = within(screen.getByRole('figure')).getAllByRole(
      'presentation'
    );
    expect(emoji.map((image) => image.style.width)).toEqual(['22px', '48px']);
    expect(screen.getByText(/Server Settings → Emoji/)).not.toHaveTextContent(
      'not a sticker'
    );
    unmount();

    render(<ConversionOutput output={output('avatar', 'clip_avatar.gif')} />);
    const avatars = within(screen.getByRole('figure')).getAllByRole(
      'presentation'
    );
    expect(avatars.map((image) => image.style.width)).toEqual(['40px', '80px']);
    for (const avatar of avatars) expect(avatar).toHaveClass('rounded-full');
  });

  test('names the preset that failed instead of rendering a preview', () => {
    render(
      <ConversionOutput output={{ name: '', url: '', type: 'sticker' }} />
    );

    expect(screen.getByText('Sticker conversion failed')).toBeInTheDocument();
    expect(screen.queryByRole('figure')).toBeNull();
    expect(screen.queryByRole('link')).toBeNull();
  });
});

describe('Discord upload help', () => {
  test('stays collapsed and lists where each output is installed', () => {
    const { container } = render(<DiscordUploadHelp />);
    const details = container.querySelector('details')!;
    expect(details).not.toHaveAttribute('open');

    fireEvent.click(screen.getByText('Adding it to Discord'));
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Emoji: Server Settings → Emoji → Upload Emoji.',
      'Sticker: Server Settings → Stickers → Upload Sticker. Up to 5 seconds. Sending the file in a message posts a plain image, not a sticker.',
      'Avatar: User Settings → Profiles → Change Avatar.',
    ]);
  });
});

function output(
  type: FFmpegFileDataOutput['type'],
  name: string
): FFmpegFileDataOutput {
  return {
    name,
    url: `blob:${name}`,
    type,
    finalSize: 400 * 1024,
  };
}
