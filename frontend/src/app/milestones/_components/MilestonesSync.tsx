import { MilestonesButton } from '@/components/ui/MilestonesButton';
import useMilestonesServer from '@/hooks/milestones/useMilestonesServer';
import useFeatureFlag from '@/hooks/useFeatureFlag';

type Props = {
  isSyncing: boolean;
  isUsingServer: boolean;
  server: ReturnType<typeof useMilestonesServer>;
};
export default function MilestonesSync({
  isSyncing,
  isUsingServer,
  server,
}: Props) {
  const { getBooleanFlag } = useFeatureFlag();
  const showComponent = getBooleanFlag('sync');
  if (!showComponent) {
    return null;
  }

  return (
    <div className='flex justify-center gap-2 pb-8'>
      <MilestonesButton
        appVariant={'milestonesSecondary'}
        disabled={isSyncing}
        onClick={
          isUsingServer
            ? server.unlinkFromServer
            : server.applyChangesToServerAndLink
        }
      >
        {isUsingServer ? 'Unlink from server' : 'Save changes to server'}
      </MilestonesButton>
      {!isUsingServer && (
        <MilestonesButton
          appVariant={'milestonesSecondary'}
          disabled={isSyncing}
          onClick={server.retrieveChangesFromServerAndLink}
        >
          Retrieve changes from server
        </MilestonesButton>
      )}
    </div>
  );
}
