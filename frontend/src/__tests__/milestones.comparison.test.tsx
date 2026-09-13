import { act, fireEvent, render, screen } from '@testing-library/react';
import MilestonesComparison from '../app/milestones/_components/MilestonesComparison';
import useMilestones from '../hooks/milestones/useMilestones';
jest.mock('lucide-react', () => ({ Eye: () => null, EyeOff: () => null }));
jest.mock(
  '../app/milestones/_components/UpdateMilestoneModal',
  () =>
    ({ trigger }: any) =>
      trigger
);
jest.mock(
  '../app/milestones/_components/DeleteMilestoneModal',
  () =>
    ({ trigger }: any) =>
      trigger
);
const start = Date.UTC(2026, 8, 12);
const milestone = {
  publicId: 'one',
  name: 'Turning 40',
  timestamp: start + 2 * 86400000,
  timezone: 'UTC',
  color: '#8884d8',
  updatedAt: start,
  deletedAt: null,
};
function store() {
  return {
    milestones: [
      milestone,
      {
        ...milestone,
        publicId: 'two',
        name: 'Turning 80',
        timestamp: start + 14612 * 86400000,
      },
    ],
    hiddenMilestoneIds: [],
    config: { diffPeriod: 'days' },
    setDiffPeriod: jest.fn(),
    hideMilestone: jest.fn(),
    unhideMilestone: jest.fn(),
  } as unknown as ReturnType<typeof useMilestones>['store'];
}
beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(start);
});
afterEach(() => {
  jest.useRealTimers();
});
test('keeps tiny countdowns readable and updates counts and bars after edits', () => {
  const data = store();
  const props = {
    store: data,
    updateMilestone: jest.fn(),
    deleteMilestone: jest.fn(),
  };
  const { container, rerender } = render(<MilestonesComparison {...props} />);
  expect(screen.getByText('2')).toBeTruthy();
  const width = () =>
    parseFloat(
      (container.querySelector('.milestones-bar') as HTMLElement).style.width
    );
  expect(width()).toBeLessThan(0.02);
  const original = width();
  rerender(
    <MilestonesComparison
      {...props}
      store={{
        ...data,
        milestones: [
          { ...milestone, timestamp: start + 4 * 86400000 },
          data.milestones[1],
        ],
      }}
    />
  );
  expect(screen.getByText('4')).toBeTruthy();
  expect(width()).toBeCloseTo(original * 2);
});
test('switches units without a stale timer and ticks the countdown', () => {
  const data = store();
  const props = {
    store: data,
    updateMilestone: jest.fn(),
    deleteMilestone: jest.fn(),
  };
  const { rerender } = render(<MilestonesComparison {...props} />);
  fireEvent.click(screen.getByRole('button', { name: 'Seconds' }));
  expect(data.setDiffPeriod).toHaveBeenCalledWith('seconds');
  rerender(
    <MilestonesComparison
      {...props}
      store={{ ...data, config: { diffPeriod: 'seconds' } }}
    />
  );
  expect(screen.getByText('172,800')).toBeTruthy();
  act(() => {
    jest.advanceTimersByTime(1000);
  });
  expect(screen.getByText('172,799')).toBeTruthy();
});
test('retains show, edit and delete controls when every milestone is hidden', () => {
  const data = { ...store(), hiddenMilestoneIds: ['one', 'two'] };
  render(
    <MilestonesComparison
      store={data}
      updateMilestone={jest.fn()}
      deleteMilestone={jest.fn()}
    />
  );
  expect(
    screen.getByText('All milestones are hidden. Show one below to compare.')
  ).toBeTruthy();
  fireEvent.click(
    screen.getByRole('button', { name: 'Show Turning 40 in comparison' })
  );
  expect(data.unhideMilestone).toHaveBeenCalledWith('one');
  expect(screen.getByRole('button', { name: 'Edit Turning 40' })).toBeTruthy();
  expect(
    screen.getByRole('button', { name: 'Delete Turning 40' })
  ).toBeTruthy();
});

test.each([
  { offsets: [-1000, 1000], origin: 50, left: [0, 50], widths: [50, 50] },
  { offsets: [-1000, 3000], origin: 25, left: [0, 25], widths: [25, 75] },
  { offsets: [-1000, -2000], origin: 100, left: [50, 0], widths: [50, 100] },
  { offsets: [1000, 2000], origin: 0, left: [0, 0], widths: [50, 100] },
  { offsets: [0, 0], origin: 50, left: [50, 50], widths: [0, 0] },
])('uses one signed axis for $offsets', ({ offsets, origin, left, widths }) => {
  const data = store();
  data.milestones = data.milestones.map((m, i) => ({
    ...m,
    timestamp: start + offsets[i],
  }));
  const { container } = render(
    <MilestonesComparison
      store={data}
      updateMilestone={jest.fn()}
      deleteMilestone={jest.fn()}
    />
  );
  container
    .querySelectorAll<HTMLElement>('.milestones-bar')
    .forEach((bar, i) => {
      expect(parseFloat(bar.style.left)).toBe(left[i]);
      expect(parseFloat(bar.style.width)).toBe(widths[i]);
    });
  container
    .querySelectorAll<HTMLElement>('.milestones-now-line')
    .forEach((line) => expect(parseFloat(line.style.left)).toBe(origin));
});

test('recalculates the axis when a past milestone is hidden', () => {
  const data = store();
  data.milestones = [
    { ...milestone, timestamp: start - 86400000 },
    { ...milestone, publicId: 'two', timestamp: start + 86400000 },
  ];
  const props = {
    store: data,
    updateMilestone: jest.fn(),
    deleteMilestone: jest.fn(),
  };
  const { container, rerender } = render(<MilestonesComparison {...props} />);
  expect(
    (container.querySelector('.milestones-now-line') as HTMLElement).style.left
  ).toBe('50%');
  rerender(
    <MilestonesComparison
      {...props}
      store={{ ...data, hiddenMilestoneIds: ['one'] }}
    />
  );
  expect(
    (container.querySelector('.milestones-now-line') as HTMLElement).style.left
  ).toBe('0%');
});
