import '@testing-library/jest-dom';
import { act, render, screen, within } from '@testing-library/react';
import type { ShortenedUrl } from '@/lib/types/shorten';

jest.mock('lucide-react', () => {
  const Icon = () => null;
  return {
    Clipboard: Icon,
    CornerRightDown: Icon,
    Trash: Icon,
    X: Icon,
    ChevronDown: Icon,
    ChevronUp: Icon,
  };
});
jest.mock('../app/_components/Navbar', () => function MockNavbar() {
  return <div>Navbar</div>;
});
jest.mock('../app/_components/Footer', () => function MockFooter() {
  return <div>Footer</div>;
});
// The real UrlCard's delete button imports the server actions.
jest.mock('../actions/urlshortener', () => ({
  deleteShortenedUrl: jest.fn(),
}));
// React 18 in Jest does not run function form actions, so the test stands in
// for a successful submit by calling the onCreated the page hands the hook.
let mockOnCreated: ((record: ShortenedUrl) => void) | undefined;
jest.mock(
  '../hooks/shorten/useCreateUrlForm',
  () =>
    ({ onCreated }: { onCreated: (record: ShortenedUrl) => void }) => {
      mockOnCreated = onCreated;
      return {
        submitForm: jest.fn(),
        handleUrlInputChange: jest.fn(),
        handleCodeInputChange: jest.fn(),
        url: '',
        customCode: '',
        codeCountText: '',
      };
    }
);

import ShortenClientPage from '@/app/shorten/_components/ShortenClientPage';

describe('URL Shortener list', () => {
  // MGK-25: the page once coerced a failed fetch to an empty list, so owners
  // were told they had no shortened URLs when the list could not be loaded.
  test('reports a failed fetch instead of an empty list', () => {
    render(<ShortenClientPage shortenedUrls={[]} loadFailed />);

    expect(screen.getByText('Failed to fetch URLs')).toBeInTheDocument();
    expect(
      screen.queryByText(/not created any shortened URLs/)
    ).not.toBeInTheDocument();
  });

  test('shows the empty-list hint when the fetch returns no URLs', () => {
    render(<ShortenClientPage shortenedUrls={[]} loadFailed={false} />);

    expect(screen.getByText(/not created any shortened URLs/)).toBeInTheDocument();
    expect(screen.queryByText(/Failed to fetch URLs/)).not.toBeInTheDocument();
  });

  // MGK-27: a URL created after a failed load was discarded, so the owner could
  // neither see nor delete it.
  test('shows a URL created after a failed load, with the failure notice', () => {
    render(<ShortenClientPage shortenedUrls={[]} loadFailed />);

    act(() =>
      mockOnCreated!({
        url: 'https://example.com/new-page',
        short_id: 'new-code',
        created: new Date('2026-11-04T10:00:00Z'),
        accessed: null,
        number_of_uses: 0,
      })
    );

    const card = screen
      .getByText('https://example.com/new-page')
      .closest('section')!;
    expect(
      within(card).getByRole('button', { name: 'Delete shortened URL' })
    ).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      /Failed to fetch URLs/
    );
    expect(
      screen.queryByText(/not created any shortened URLs/)
    ).not.toBeInTheDocument();
  });
});
