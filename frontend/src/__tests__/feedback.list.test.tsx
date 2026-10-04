import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const mockGetFeedback = jest.fn();
const mockDeleteFeedback = jest.fn();
jest.mock('../hooks/useFeedback', () => ({
  useFeedback: () => ({
    getFeedback: mockGetFeedback,
    deleteFeedback: mockDeleteFeedback,
  }),
}));
jest.mock('lucide-react', () => ({ MessageSquareText: () => <span /> }));

import FeedbackList from '@/app/account/home/_components/FeedbackList';

const item = (id: number) => ({
  id,
  comment: `Message ${id}`,
  createdBy: 'Anonymous',
  originPath: '/',
  createdAt: '2026-10-03T00:00:00Z',
});
const page = (ids: number[], nextCursor: number | null) => ({
  type: 'success',
  status: 200,
  data: { feedbacks: ids.map(item), nextCursor },
});

beforeEach(() => {
  jest.clearAllMocks();
});

test('loads bounded pages on demand, appends them and stops at the last page', async () => {
  mockGetFeedback
    .mockResolvedValueOnce(page([3, 2], 2))
    .mockResolvedValueOnce(page([1], null));
  render(<FeedbackList />);
  await screen.findByText('Message 3');
  expect(mockGetFeedback).toHaveBeenCalledTimes(1);
  fireEvent.click(screen.getByRole('button', { name: 'Load older feedback' }));
  await screen.findByText('Message 1');
  expect(screen.getByText('Message 3')).toBeTruthy();
  expect(mockGetFeedback).toHaveBeenLastCalledWith(2);
  expect(
    screen.queryByRole('button', { name: 'Load older feedback' })
  ).toBeNull();
});

test('failed older-page fetch preserves messages and can be retried', async () => {
  mockGetFeedback
    .mockResolvedValueOnce(page([2], 2))
    .mockResolvedValueOnce({ type: 'error', status: 503 })
    .mockResolvedValueOnce(page([1], null));
  render(<FeedbackList />);
  await screen.findByText('Message 2');
  fireEvent.click(screen.getByRole('button', { name: 'Load older feedback' }));
  await screen.findByText('Failed to fetch feedback.');
  expect(screen.getByText('Message 2')).toBeTruthy();
  await waitFor(() =>
    expect(
      (
        screen.getByRole('button', {
          name: 'Load older feedback',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(false)
  );
  fireEvent.click(screen.getByRole('button', { name: 'Load older feedback' }));
  await screen.findByText('Message 1');
  expect(screen.queryByText('Failed to fetch feedback.')).toBeNull();
});
