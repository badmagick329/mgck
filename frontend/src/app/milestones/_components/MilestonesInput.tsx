import useMilestones from '@/hooks/milestones/useMilestones';
import DatetimePicker from '@/app/milestones/_components/DatetimePicker';
import ColorPicker from '@/app/milestones/_components/ColorPicker';
import { Input } from '@/components/ui/input';
import { MilestonesButton } from '@/components/ui/MilestonesButton';
import { DEFAULT_COLOR } from '@/lib/consts/milestones';
import { useState } from 'react';
import useDebounceInput from '@/hooks/useDebounceInput';

type Props = {
  isSyncing: boolean;
  createMilestone: ReturnType<typeof useMilestones>['createMilestone'];
};

export default function MilestonesInput({ isSyncing, createMilestone }: Props) {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [name, setName] = useState('');
  const { value: color, handleChange: handleColorChange } = useDebounceInput({
    defaultValue: DEFAULT_COLOR,
    delay: 100,
  });

  return (
    <div className='mx-auto flex w-full max-w-4xl flex-col items-center gap-4 rounded-md bg-background-light-ml px-4 py-6 shadow-card md:flex-row'>
      <Input
        type='text'
        onChange={(e) => setName(e.target.value || '')}
        value={name}
        disabled={isSyncing}
        placeholder='Enter milestone name... e.g Birthday'
        className='focus-visible:ring-0 focus-visible:ring-offset-0'
      />
      <div className='flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center'>
        <DatetimePicker date={date} setDate={setDate} disabled={isSyncing} />
        <div className='flex w-full items-center justify-between gap-4 px-1'>
          <ColorPicker color={color} handleColorChange={handleColorChange} />
          <MilestonesButton
            className='h-10'
            appVariant={'milestonesPrimary'}
            onClick={() => {
              (async () => {
                const result = await createMilestone({ name, date, color });
                if (result.ok) {
                  setName('');
                  setDate(undefined);
                }
              })();
            }}
            disabled={isSyncing}
          >
            Add
          </MilestonesButton>
        </div>
      </div>
    </div>
  );
}
