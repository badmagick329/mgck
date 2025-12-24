import { Button } from '@/components/ui/button';
import useMilestones from '@/hooks/milestones/useMilestones';

type Props = {
  state: ReturnType<typeof useMilestones>['state'];
  db: ReturnType<typeof useMilestones>['db'];
};
export default function MilestonesSync({ state, db }: Props) {
  return (
    <div className='flex justify-center gap-2'>
      <Button
        variant={'secondary'}
        disabled={state.isSyncing}
        onClick={
          state.isUsingServer
            ? state.unlinkFromServer
            : db.applyChangesToServerAndLink
        }
      >
        {state.isUsingServer ? 'Unlink from server' : 'Save changes to server'}
      </Button>
      {!state.isUsingServer && (
        <Button
          variant={'secondary'}
          disabled={state.isSyncing}
          onClick={db.retrieveChangesFromServerAndLink}
        >
          Retrieve changes from server
        </Button>
      )}
    </div>
  );
}
