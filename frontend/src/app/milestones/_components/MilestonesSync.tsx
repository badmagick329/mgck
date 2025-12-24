import { Button } from '@/components/ui/button';
import { MilestonesButton } from '@/components/ui/MilestonesButton';
import useMilestones from '@/hooks/milestones/useMilestones';

type Props = {
  state: ReturnType<typeof useMilestones>['state'];
  db: ReturnType<typeof useMilestones>['db'];
};
export default function MilestonesSync({ state, db }: Props) {
  return (
    <div className='flex justify-center gap-2 pb-8'>
      <MilestonesButton
        appVariant={'milestonesSecondary'}
        disabled={state.isSyncing}
        onClick={
          state.isUsingServer
            ? state.unlinkFromServer
            : db.applyChangesToServerAndLink
        }
      >
        {state.isUsingServer ? 'Unlink from server' : 'Save changes to server'}
      </MilestonesButton>
      {!state.isUsingServer && (
        <MilestonesButton
          appVariant={'milestonesSecondary'}
          disabled={state.isSyncing}
          onClick={db.retrieveChangesFromServerAndLink}
        >
          Retrieve changes from server
        </MilestonesButton>
      )}
    </div>
  );
}
