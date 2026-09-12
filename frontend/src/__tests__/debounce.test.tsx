import { act, renderHook } from '@testing-library/react';
import useDebounce from '@/hooks/useDebounce';
import useDebounceInput from '@/hooks/useDebounceInput';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('coalesces calls made before React renders again', () => {
  const callback = jest.fn();
  const { result } = renderHook(() => useDebounce<[string]>(100));

  act(() => {
    result.current(callback, 'first');
    result.current(callback, 'last');
    jest.advanceTimersByTime(100);
  });

  expect(callback).toHaveBeenCalledTimes(1);
  expect(callback).toHaveBeenCalledWith('last');
});

test('cancels pending callbacks on unmount', () => {
  const callback = jest.fn();
  const { result, unmount } = renderHook(() => useDebounce<[]>(100));
  act(() => result.current(callback));
  unmount();
  act(() => jest.runAllTimers());
  expect(callback).not.toHaveBeenCalled();
});

test('cancels pending input and uses an updated delay', () => {
  const { result, rerender } = renderHook(
    ({ delay }) => useDebounceInput({ defaultValue: 'initial', delay }),
    { initialProps: { delay: 100 } }
  );
  const change = (value: string) =>
    result.current.handleChange({
      target: { value },
    } as React.ChangeEvent<HTMLInputElement>);

  act(() => change('stale'));
  rerender({ delay: 200 });
  act(() => jest.advanceTimersByTime(100));
  expect(result.current.value).toBe('initial');

  act(() => change('latest'));
  act(() => jest.advanceTimersByTime(100));
  expect(result.current.value).toBe('initial');
  act(() => jest.advanceTimersByTime(100));
  expect(result.current.value).toBe('latest');
});
