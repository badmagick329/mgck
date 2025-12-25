import useMilestones from '@/hooks/milestones/useMilestones';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import ColorPicker from '@/app/milestones/_components/ColorPicker';
import { Input } from '@/components/ui/input';
import { MilestonesButton } from '@/components/ui/MilestonesButton';

type Props = {
  state: ReturnType<typeof useMilestones>['state'];
  addCurrentMilestone: ReturnType<
    typeof useMilestones
  >['db']['addCurrentMilestone'];
};

export default function MilestonesInput({ state, addCurrentMilestone }: Props) {
  return (
    <div className='flex flex-col items-center gap-4 rounded-md bg-background-light-ml px-4 py-6 shadow-card md:flex-row'>
      <Input
        type='text'
        onChange={(e) => state.setName(e.target.value || '')}
        value={state.name}
        disabled={state.isSyncing}
        placeholder='Enter milestone name... e.g Birthday'
        className='focus-visible:ring-0 focus-visible:ring-offset-0'
      />
      <div className='flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center'>
        <DatetimePicker
          date={state.date}
          setDate={state.setDate}
          disabled={state.isSyncing}
        />
        <div className='flex w-full items-center justify-between gap-4 px-1'>
          <ColorPicker
            color={state.color}
            handleColorChange={state.handleColorChange}
          />
          <MilestonesButton
            className='h-10'
            appVariant={'milestonesPrimary'}
            onClick={addCurrentMilestone}
            disabled={state.isSyncing}
          >
            Add
          </MilestonesButton>
        </div>
      </div>
    </div>
  );
}
