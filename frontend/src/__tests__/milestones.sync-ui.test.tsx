import { render, screen } from '@testing-library/react';

jest.mock('../hooks/milestones/useMilestones', () => jest.fn());
jest.mock('../app/_components/Navbar', () => () => <div>Navbar</div>);
jest.mock('../app/_components/Footer', () => () => <div>Footer</div>);
jest.mock('../app/milestones/_components/MilestonesChart', () => () => (
  <div>Chart</div>
));
jest.mock('../app/milestones/_components/MilestonesDisplay', () => () => (
  <div>Display</div>
));
jest.mock('../app/milestones/_components/MilestonesInput', () => () => (
  <div>Input</div>
));
jest.mock('../app/milestones/_components/MilestonesHeading', () => () => (
  <div>Heading</div>
));

import MilestonesClient from '@/app/milestones/_components/MilestonesClient';
import useMilestones from '../hooks/milestones/useMilestones';

const mockUseMilestones = useMilestones as jest.Mock;

describe('milestone automatic-only UI', () => {
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
