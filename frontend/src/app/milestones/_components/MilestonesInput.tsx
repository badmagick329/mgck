import useMilestones from '@/hooks/milestones/useMilestones';
import { Button } from '@/components/ui/button';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import ColorPicker from '@/app/milestones/_components/ColorPicker';
import { Input } from '@/components/ui/input';

type Props = {
  state: ReturnType<typeof useMilestones>['state'];
  addCurrentMilestone: ReturnType<
    typeof useMilestones
  >['db']['addCurrentMilestone'];
};

export default function MilestonesInput({ state, addCurrentMilestone }: Props) {
  return (
    <div className='flex flex-col items-center gap-4 lg:col-span-2'>
      <Input
        type='text'
        onChange={(e) => state.setName(e.target.value || '')}
        value={state.name}
        disabled={state.isSyncing}
        placeholder='Enter milestone name... e.g Birthday'
      />
      <div className='flex w-full items-center gap-2'>
        <DatetimePicker
          date={state.date}
          setDate={state.setDate}
          disabled={state.isSyncing}
        />
        <ColorPicker
          color={state.color}
          handleColorChange={state.handleColorChange}
        />
      </div>
      <Button
        className='h-10'
        variant={'secondary'}
        onClick={addCurrentMilestone}
        disabled={state.isSyncing}
      >
        Add
      </Button>
    </div>
  );
}
