import { act, renderHook } from '@testing-library/react';
import { GfyContextProvider, useGfyContext } from '@/app/gfys/_context/store';
import { searchGfys } from '@/actions/gfys';
import { ReadonlyURLSearchParams } from 'next/navigation';
import useNavButton from '@/hooks/gfys/useNavButton';

jest.mock('next/navigation', () => ({
  ...jest.requireActual('next/navigation'),
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('../actions/gfys', () => ({ searchGfys: jest.fn() }));

const resultClip = (id: string) => ({
  imgur_id: id,
  imgur_title: `Original ${id}`,
  display_title: id,
  gfy_id: null,
  gfy_title: null,
  tags: ['Irene'],
  date: null,
  account: null,
  width: null,
  height: null,
  view_count: 0,
});

beforeEach(() => {
  (searchGfys as jest.Mock).mockResolvedValue({
    count: 6,
    previous: 'https://example.com/gfys?page=1',
    next: 'https://example.com/gfys?page=3',
    total_pages: 3,
    results: ['a', 'b', 'c'].map(resultClip),
  });
});

async function loadedContext() {
  const hook = renderHook(() => useGfyContext(), {
    wrapper: GfyContextProvider,
  });
  await act(async () => {
    await hook.result.current.updateDataFromParams(
      new ReadonlyURLSearchParams('tags=Irene&page=2')
    );
  });
  return hook;
}

test('navigation button availability follows related jumps to the middle and last clip', async () => {
  const { result } = renderHook(
    () => ({
      context: useGfyContext(),
      previous: useNavButton('previous'),
      next: useNavButton('next'),
    }),
    { wrapper: GfyContextProvider }
  );
  await act(async () => {
    await result.current.context.updateDataFromParams(
      new ReadonlyURLSearchParams('tags=Irene&page=2')
    );
  });
  // First result page has no previous page: Previous begins unavailable.
  (searchGfys as jest.Mock).mockResolvedValueOnce({
    count: 3,
    previous: null,
    next: null,
    total_pages: 1,
    results: ['a', 'b', 'c'].map(resultClip),
  });
  await act(async () => {
    await result.current.context.updateDataFromParams(
      new ReadonlyURLSearchParams('tags=Irene')
    );
  });
  expect(result.current.previous.isDisabled).toBe(true);
  act(() => result.current.context.reconcileCurrentGfy('b'));
  expect(result.current.previous.isDisabled).toBe(false);
  expect(result.current.next.isDisabled).toBe(false);
  act(() => result.current.context.reconcileCurrentGfy('c'));
  expect(result.current.previous.isDisabled).toBe(false);
  expect(result.current.next.isDisabled).toBe(true);
  act(() => result.current.context.reconcileCurrentGfy('outside'));
  expect(result.current.previous.shouldRender).toBe(false);
  expect(result.current.next.shouldRender).toBe(false);
});

test('a related jump within the loaded result page moves arrows from the current clip', async () => {
  const { result } = await loadedContext();
  act(() => result.current.reconcileCurrentGfy('b'));
  expect(result.current.gfyViewData.index).toBe(1);
  await act(async () => {
    expect(await result.current.goToNextGfy()).toBe('/gfys/c');
  });
  act(() => result.current.reconcileCurrentGfy('a'));
  expect(result.current.gfyViewData.index).toBe(0);
});

test('an outside-page jump clears unrelated navigation and loop while retaining Back to results', async () => {
  const { result } = await loadedContext();
  const listUrl = result.current.gfyViewData.listUrl;
  act(() => result.current.setLoopAll(true));
  act(() => result.current.reconcileCurrentGfy('outside'));
  expect(result.current.gfyViewData.videoIds).toEqual([]);
  expect(result.current.gfyViewData.listUrl).toBe(listUrl);
  expect(listUrl).toBe('/gfys?tags=Irene&page=2');
  expect(result.current.loopAll).toBe(false);
  expect(result.current.nextGfyExists()).toBe(false);
  expect(result.current.previousGfyExists()).toBe(false);
  expect(result.current.data.next).toBeNull();
  expect(result.current.data.previous).toBeNull();
  await act(async () => {
    expect(await result.current.goToNextGfy(true)).toBeNull();
    expect(await result.current.goToPreviousGfy(true)).toBeNull();
  });
  // Returning to results reloads the preserved query and restores its sequence.
  await act(async () => {
    await result.current.updateDataFromParams(
      new ReadonlyURLSearchParams(listUrl.split('?')[1])
    );
  });
  expect(result.current.gfyViewData.videoIds).toEqual(['a', 'b', 'c']);
});

test('loading the next result page keeps reconciliation stable until the new detail arrives', async () => {
  const { result } = await loadedContext();
  const reconcile = result.current.reconcileCurrentGfy;
  act(() => reconcile('c'));
  (searchGfys as jest.Mock).mockResolvedValueOnce({
    count: 6,
    previous: 'https://example.com/gfys?page=2',
    next: null,
    total_pages: 3,
    results: ['d', 'e', 'f'].map(resultClip),
  });
  await act(async () => {
    expect(await result.current.goToNextGfy()).toBe('/gfys/d');
  });
  expect(result.current.reconcileCurrentGfy).toBe(reconcile);
  expect(result.current.gfyViewData.videoIds).toEqual(['d', 'e', 'f']);
  act(() => reconcile('d'));
  expect(result.current.gfyViewData.index).toBe(0);
});
