import { MilestonesButton } from '@/components/ui/MilestonesButton';
import useMilestones from '@/hooks/milestones/useMilestones';
import useFeatureFlag from '@/hooks/useFeatureFlag';

type Props = {
  state: ReturnType<typeof useMilestones>['state'];
  db: ReturnType<typeof useMilestones>['db'];
  isUsingServer: boolean;
};
export default function MilestonesSync({ state, db, isUsingServer }: Props) {
  const { getBooleanFlag } = useFeatureFlag();
  const showComponent = getBooleanFlag('milestoneServerSync');
  if (!showComponent) {
    return null;
  }

  return (
    <div className='flex justify-center gap-2 pb-8'>
      <MilestonesButton
        appVariant={'milestonesSecondary'}
        disabled={state.isSyncing}
        onClick={
          isUsingServer
            ? state.unlinkFromServer
            : db.applyChangesToServerAndLink
        }
      >
        {isUsingServer ? 'Unlink from server' : 'Save changes to server'}
      </MilestonesButton>
      {!isUsingServer && (
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
