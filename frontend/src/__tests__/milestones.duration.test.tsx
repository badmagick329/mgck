import { act, fireEvent, render, screen } from '@testing-library/react';
import MilestonesInput from '../app/milestones/_components/MilestonesInput';
import {
  isDurationUnit,
  resolveDurationDate,
} from '../lib/milestones/duration';

jest.mock('lucide-react', () => ({
  Check: () => null,
  ChevronDown: () => null,
  ChevronUp: () => null,
}));

const local = (
  year: number,
  month: number,
  day: number,
  hours = 0,
  minutes = 0
) => new Date(year, month, day, hours, minutes);

const expectLocalDate = (date: Date, expected: Date) => {
  expect(date.getFullYear()).toBe(expected.getFullYear());
  expect(date.getMonth()).toBe(expected.getMonth());
  expect(date.getDate()).toBe(expected.getDate());
  expect(date.getHours()).toBe(0);
  expect(date.getMinutes()).toBe(0);
};

test('adds days and weeks to the calendar date, not raw milliseconds', () => {
  const from = local(2026, 0, 1, 13, 45);
  expectLocalDate(
    resolveDurationDate({ amount: 50, unit: 'days', from }),
    local(2026, 1, 20)
  );
  expectLocalDate(
    resolveDurationDate({ amount: 3, unit: 'weeks', from }),
    local(2026, 0, 22)
  );
});

test('clamps month durations to the last day of the target month', () => {
  expectLocalDate(
    resolveDurationDate({
      amount: 1,
      unit: 'months',
      from: local(2026, 0, 31),
    }),
    local(2026, 1, 28)
  );
  expectLocalDate(
    resolveDurationDate({
      amount: 1,
      unit: 'months',
      from: local(2024, 0, 31),
    }),
    local(2024, 1, 29)
  );
  expectLocalDate(
    resolveDurationDate({
      amount: 3,
      unit: 'months',
      from: local(2026, 10, 30),
    }),
    local(2027, 1, 28)
  );
});

test('keeps the day of month when it fits in the target month', () => {
  expectLocalDate(
    resolveDurationDate({
      amount: 3,
      unit: 'months',
      from: local(2026, 0, 15),
    }),
    local(2026, 3, 15)
  );
});

test('recognises only the supported duration units', () => {
  expect(isDurationUnit('days')).toBe(true);
  expect(isDurationUnit('weeks')).toBe(true);
  expect(isDurationUnit('months')).toBe(true);
  expect(isDurationUnit('hours')).toBe(false);
});

test('submits a duration as a local-midnight timestamp', async () => {
  const now = local(2026, 0, 1, 13, 45).getTime();
  jest.useFakeTimers();
  jest.setSystemTime(now);
  try {
    const createMilestone = jest.fn().mockResolvedValue({ ok: true });
    const onCreated = jest.fn();
    render(
      <MilestonesInput
        createMilestone={createMilestone}
        onCreated={onCreated}
      />
    );

    fireEvent.change(screen.getByLabelText('Milestone'), {
      target: { value: 'Trip' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Duration' }));
    fireEvent.change(screen.getByLabelText('Duration amount'), {
      target: { value: '50' },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Add milestone' }));
    });

    expect(createMilestone).toHaveBeenCalledTimes(1);
    const passed = createMilestone.mock.calls[0][0];
    expect(passed.name).toBe('Trip');
    expect(passed.date.getTime()).toBe(local(2026, 1, 20).getTime());
    expect(onCreated).toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});
