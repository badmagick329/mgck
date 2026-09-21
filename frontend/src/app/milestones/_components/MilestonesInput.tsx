import useMilestones from '@/hooks/milestones/useMilestones';
import { DEFAULT_COLOR } from '@/lib/consts/milestones';
import {
  DurationUnit,
  isDurationUnit,
  resolveDurationDate,
} from '@/lib/milestones/duration';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useState } from 'react';

type Props = {
  createMilestone: ReturnType<typeof useMilestones>['createMilestone'];
  onCreated: () => void;
};

type ScheduleMode = 'date' | 'duration';

const UNIT_LABELS: Record<DurationUnit, string> = {
  days: 'Days',
  weeks: 'Weeks',
  months: 'Months',
};

export default function MilestonesInput({ createMilestone, onCreated }: Props) {
  const [mode, setMode] = useState<ScheduleMode>('date');
  const [date, setDate] = useState('');
  const [durationAmount, setDurationAmount] = useState('');
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('days');
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);

  const parsedAmount = Number(durationAmount);
  const hasValidDuration = Number.isInteger(parsedAmount) && parsedAmount > 0;
  const resolvedDate =
    mode === 'duration' && hasValidDuration
      ? resolveDurationDate({
          amount: parsedAmount,
          unit: durationUnit,
          from: new Date(),
        })
      : undefined;

  return (
    <form
      className='milestones-form'
      onSubmit={async (e) => {
        e.preventDefault();
        const targetDate =
          mode === 'date'
            ? date
              ? new Date(`${date}T00:00:00`)
              : undefined
            : resolvedDate;
        const result = await createMilestone({
          name,
          date: targetDate,
          color,
        });
        if (result.ok) {
          setName('');
          setDate('');
          setDurationAmount('');
          onCreated();
        }
      }}
    >
      <ToggleGroup
        type='single'
        value={mode}
        onValueChange={(value) => {
          if (value) setMode(value as ScheduleMode);
        }}
        className='milestones-mode'
        aria-label='Choose between a specific date and a duration'
      >
        <ToggleGroupItem value='date'>Date</ToggleGroupItem>
        <ToggleGroupItem value='duration'>Duration</ToggleGroupItem>
      </ToggleGroup>
      <div className='milestones-fields'>
        <label>
          Milestone
          <input
            autoFocus
            required
            maxLength={255}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder='e.g. Graduation'
          />
        </label>
        <div className='milestones-when'>
          <span className='milestones-when-label'>When</span>
          {mode === 'date' ? (
            <input
              required
              type='date'
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label='Milestone date'
            />
          ) : (
            <>
              <div className='milestones-duration'>
                <Input
                  required
                  type='text'
                  inputMode='numeric'
                  pattern='[0-9]*'
                  className='focus-visible:ring-0 focus-visible:ring-offset-0'
                  value={durationAmount}
                  onChange={(e) =>
                    setDurationAmount(e.target.value.replace(/\D/g, ''))
                  }
                  placeholder='e.g. 50'
                  aria-label='Duration amount'
                />
                <Select
                  value={durationUnit}
                  onValueChange={(value) => {
                    if (isDurationUnit(value)) setDurationUnit(value);
                  }}
                >
                  <SelectTrigger
                    className='milestones-select-trigger focus:ring-0 focus:ring-offset-0'
                    aria-label='Duration unit'
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className='milestones-select-content'>
                    {Object.entries(UNIT_LABELS).map(([unit, label]) => (
                      <SelectItem key={unit} value={unit}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {resolvedDate && (
                <p className='milestones-duration-preview'>
                  {resolvedDate.toLocaleDateString()}
                </p>
              )}
            </>
          )}
        </div>
        <label className='milestones-color'>
          Colour
          <input
            type='color'
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <button className='milestones-add'>Add milestone</button>
      </div>
    </form>
  );
}
