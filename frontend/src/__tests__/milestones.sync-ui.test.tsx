import { render, screen } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('sync=1'),
}));

import MilestonesSync from '@/app/milestones/_components/MilestonesSync';

const server = {
  applyChangesToServerAndLink: jest.fn(),
  retrieveChangesFromServerAndLink: jest.fn(),
  unlinkFromServer: jest.fn(),
} as any;

describe('milestone sync controls', () => {
  test('shows legacy controls only when automatic sync is disabled', () => {
    const { rerender } = render(
      <MilestonesSync
        isSyncing={false}
        isUsingServer={false}
        isAuthenticated={true}
        automaticSyncEnabled={true}
        server={server}
      />
    );
    expect(screen.queryByText('Save changes to server')).toBeNull();

    rerender(
      <MilestonesSync
        isSyncing={false}
        isUsingServer={false}
        isAuthenticated={true}
        automaticSyncEnabled={false}
        server={server}
      />
    );
    expect(screen.getByText('Save changes to server')).not.toBeNull();
    expect(screen.getByText('Retrieve changes from server')).not.toBeNull();
  });
});
