import useMilestones from '@/hooks/milestones/useMilestones';
import { DEFAULT_COLOR } from '@/lib/consts/milestones';
import { useState } from 'react';
type Props = {
  createMilestone: ReturnType<typeof useMilestones>['createMilestone'];
  onCreated: () => void;
};
export default function MilestonesInput({ createMilestone, onCreated }: Props) {
  const [date, setDate] = useState('');
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_COLOR);
  return (
    <form
      className='milestones-form'
      onSubmit={async (e) => {
        e.preventDefault();
        const result = await createMilestone({
          name,
          date: date ? new Date(`${date}T00:00:00`) : undefined,
          color,
        });
        if (result.ok) {
          setName('');
          setDate('');
          onCreated();
        }
      }}
    >
      <label>
        Milestone
        <input
          autoFocus
          required
          maxLength={255}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder='e.g. Turning 40'
        />
      </label>
      <label>
        Date
        <input
          required
          type='date'
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </label>
      <label className='milestones-color'>
        Colour
        <input
          type='color'
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </label>
      <button className='milestones-add'>Add milestone</button>
    </form>
  );
}
