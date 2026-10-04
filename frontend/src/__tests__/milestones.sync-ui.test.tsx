import { render, screen } from '@testing-library/react';

jest.mock('../hooks/milestones/useMilestones', () => jest.fn());
jest.mock('../app/_components/Navbar', () => () => <div>Navbar</div>);
jest.mock('../app/_components/Footer', () => () => <div>Footer</div>);
jest.mock('../app/milestones/_components/MilestonesInput', () => () => (
  <div>Input</div>
));

jest.mock('../app/milestones/_components/MilestonesComparison', () => () => (
  <div>Comparison</div>
));

import MilestonesClient from '@/app/milestones/_components/MilestonesClient';
import useMilestones from '../hooks/milestones/useMilestones';

const mockUseMilestones = useMilestones as jest.Mock;

describe('milestone automatic-only UI', () => {
  test('explains quota rejection without promising a successful automatic retry', () => {
    mockUseMilestones.mockReturnValue({
      store: {
        isLoaded: true,
        loadWarning: null,
        storageKey: 'account:alice',
        milestones: [],
      },
      syncStatus: 'storage-limit',
      createMilestone: jest.fn(),
      updateMilestone: jest.fn(),
      deleteMilestone: jest.fn(),
    });
    render(
      <MilestonesClient account={{ userId: 'alice', username: 'Alice' }} />
    );
    expect(screen.getByRole('status').textContent).toContain(
      'Server storage limit reached.'
    );
    expect(screen.getByRole('status').textContent).toContain(
      'saved on this device'
    );
    expect(screen.getByRole('status').textContent).toContain('Deleted records');
    expect(screen.getByRole('status').textContent).not.toContain(
      'retry automatically'
    );
  });
  test('renders without manual sync or backup controls', () => {
    mockUseMilestones.mockReturnValue({
      store: {
        isLoaded: true,
        loadWarning: null,
        storageKey: 'mgck:milestones:account:alice:v3',
        milestones: [],
        records: [],
        config: { diffPeriod: 'days' },
        hiddenMilestoneIds: [],
        setDiffPeriod: jest.fn(),
      },
      syncStatus: 'idle',
      createMilestone: jest.fn(),
      updateMilestone: jest.fn(),
      deleteMilestone: jest.fn(),
    });

    render(
      <MilestonesClient account={{ userId: 'alice', username: 'Alice' }} />
    );

    expect(screen.queryByText('Save changes to server')).toBeNull();
    expect(screen.queryByText('Retrieve changes from server')).toBeNull();
    expect(screen.queryByText('Unlink from server')).toBeNull();
    expect(screen.queryByText('Backup')).toBeNull();
    expect(screen.queryByText('Restore')).toBeNull();
  });
});
