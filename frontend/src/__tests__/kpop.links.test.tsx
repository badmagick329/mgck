import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import ComebackLinks from '@/app/kpop/_components/ComebackLinks';

const defaultProps = {
  youtubeUrls: [] as string[],
  spotifyUrls: [] as string[],
  appleMusicUrls: [] as string[],
  artist: 'Red Velvet',
  title: 'Cosmic',
  releaseDate: '2020-01-01',
};

test('renders direct service links and omits YouTube search', () => {
  render(
    <ComebackLinks
      {...defaultProps}
      youtubeUrls={['https://youtu.be/FyG21rXCxlY']}
      spotifyUrls={['https://open.spotify.com/album/example']}
      appleMusicUrls={['https://music.apple.com/gb/album/example']}
    />
  );

  expect(
    screen.getByRole('link', { name: /watch red velvet cosmic on youtube/i })
  ).toHaveAttribute('href', 'https://youtube.com/watch?v=FyG21rXCxlY');
  expect(screen.getByRole('link', { name: /on spotify/i })).toHaveAttribute(
    'href',
    'https://open.spotify.com/album/example'
  );
  expect(screen.getByRole('link', { name: /on apple music/i })).toHaveAttribute(
    'href',
    'https://music.apple.com/gb/album/example'
  );
  expect(
    screen.queryByRole('link', { name: /search youtube/i })
  ).not.toBeInTheDocument();
});

test('falls back to YouTube search and omits missing streaming services', () => {
  render(<ComebackLinks {...defaultProps} />);

  const searchLink = screen.getByRole('link', {
    name: /search youtube for red velvet cosmic/i,
  });
  expect(searchLink).toHaveAttribute(
    'href',
    'https://youtube.com/results?search_query=Red%20Velvet%20Cosmic'
  );
  expect(searchLink).toHaveClass('text-muted-foreground');
  expect(searchLink.querySelector('.search-icon')).toBeInTheDocument();
  expect(screen.queryByText('Spotify')).not.toBeInTheDocument();
  expect(screen.queryByText('Apple Music')).not.toBeInTheDocument();
});
