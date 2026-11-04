import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

jest.mock('../app/_components/Navbar', () => function MockNavbar() {
  return <div>Navbar</div>;
});
jest.mock('../app/_components/Footer', () => function MockFooter() {
  return <div>Footer</div>;
});
jest.mock('../hooks/shorten/useCreateUrlForm', () => () => ({
  submitForm: jest.fn(),
  handleUrlInputChange: jest.fn(),
  handleCodeInputChange: jest.fn(),
  url: '',
  customCode: '',
  codeCountText: '',
}));
jest.mock('../app/shorten/_components/UrlCard', () =>
  function MockUrlCard({ shortenedUrl }: { shortenedUrl: { short_id: string } }) {
    return <div data-testid='url-card'>{shortenedUrl.short_id}</div>;
  }
);

import ShortenClientPage from '@/app/shorten/_components/ShortenClientPage';

describe('URL Shortener list', () => {
  // MGK-25: the page once coerced a failed fetch to an empty list, so owners
  // were told they had no shortened URLs when the list could not be loaded.
  test('reports a failed fetch instead of an empty list', () => {
    render(<ShortenClientPage shortenedUrls={null} />);

    expect(screen.getByText('Failed to fetch URLs')).toBeInTheDocument();
    expect(
      screen.queryByText(/not created any shortened URLs/)
    ).not.toBeInTheDocument();
  });

  test('shows the empty-list hint when the fetch returns no URLs', () => {
    render(<ShortenClientPage shortenedUrls={[]} />);

    expect(screen.getByText(/not created any shortened URLs/)).toBeInTheDocument();
    expect(screen.queryByText('Failed to fetch URLs')).not.toBeInTheDocument();
  });
});
