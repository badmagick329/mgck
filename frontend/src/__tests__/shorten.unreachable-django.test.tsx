import '@testing-library/jest-dom';
import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from '@testing-library/react';

// MGK-27: the shortener actions let a rejected fetch escape, so an unreachable
// Django crashed /shorten into its error boundary and failed create and delete
// silently.
jest.mock('server-only', () => ({}));
jest.mock('next/headers', () => ({ cookies: jest.fn() }));
jest.mock('next/cache', () => ({ revalidateTag: jest.fn() }));
jest.mock('../lib/account/verified-session', () => {
  const session = { userId: 'user-1', username: 'Alice', role: 'AcceptedUser' };
  return {
    getVerifiedCoreSession: jest.fn(async () => session),
    getCurrentCoreSession: jest.fn(async () => session),
  };
});
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

// The actions read BASE_URL at module load, so the env is set here and the
// modules under test are required lazily inside each test.
process.env.BASE_URL = 'http://django.test';
process.env.NEXT_DJANGO_INTERNAL_API_KEY =
  'test-internal-key-at-least-32-characters';

let consoleError: jest.SpyInstance;

beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.reject(new TypeError('fetch failed'))
  ) as typeof fetch;
  consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => consoleError.mockRestore());

describe('URL Shortener with Django unreachable', () => {
  test('/shorten renders the failed-load state', async () => {
    const { default: ShortenPage } = await import('@/app/shorten/page');

    render(await ShortenPage());

    expect(screen.getByText('Failed to fetch URLs')).toBeInTheDocument();
  });

  test('creating a URL reports the failure', async () => {
    const { default: useCreateUrlForm } = await import(
      '@/hooks/shorten/useCreateUrlForm'
    );
    const setError = jest.fn();
    const { result } = renderHook(() =>
      useCreateUrlForm({ setError, setOutput: jest.fn(), onCreated: jest.fn() })
    );

    await act(() => result.current.submitForm());

    expect(setError).toHaveBeenLastCalledWith('Failed to shorten url');
  });

  test('deleting a URL shows the failure in the dialog', async () => {
    const { default: ShortenClientPage } = await import(
      '@/app/shorten/_components/ShortenClientPage'
    );
    render(
      <ShortenClientPage
        loadFailed={false}
        shortenedUrls={[
          {
            url: 'https://example.com/page',
            short_id: 'code',
            created: new Date('2026-11-04T10:00:00Z'),
            accessed: null,
            number_of_uses: 0,
          },
        ]}
      />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete shortened URL' })
    );
    fireEvent.click(screen.getByRole('button', { name: 'Submit' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Failed to delete shortened url'
    );
  });
});
