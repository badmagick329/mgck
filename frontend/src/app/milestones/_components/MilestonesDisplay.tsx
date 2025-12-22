'use client';
import { Button } from '@/components/ui/button';
import { getDiffInDays, getLocalDatetimeDisplay } from '@/lib/milestones';
import { ClientMilestone } from '@/lib/types/milestones';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function MilestonesDisplay({
  milestones,
  isSyncing,
  removeMilestone,
}: {
  milestones: ClientMilestone[];
  isSyncing: boolean;
  removeMilestone: (name: string) => void;
}) {
  const chartData = transformMilestonesForChart(milestones);
  const maxLabelLength = Math.max(...chartData.map((d) => d.name.length));
  const yAxisWidth = maxLabelLength * 8;
  return (
    <div className='mx-auto flex w-full max-w-lg flex-col gap-4'>
      <div className='mx-auto flex w-full flex-col items-center gap-2'>
        <ResponsiveContainer width='100%' height={200}>
          <BarChart data={chartData} layout='vertical' barCategoryGap={2}>
            <XAxis type='number' />
            <YAxis type='category' width={yAxisWidth} dataKey='name' />
            <Tooltip />
            <Legend />
            <Bar
              dataKey='days'
              fill='#8884d8'
              activeBar={{ fill: 'pink', stroke: 'blue' }}
              radius={[0, 4, 4, 0]}
              label={{ fill: 'white', fontSize: 14 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {milestones.length > 0 ? (
        milestones.map((m) => {
          const date = new Date(m.timestamp);
          return (
            <div key={m.name} className='flex justify-between gap-2'>
              <p>
                {m.name} - {getLocalDatetimeDisplay(date, m.timezone)} - (
                {getDiffInDays(date)})
              </p>
              <Button
                variant={'destructive'}
                onClick={() => removeMilestone(m.name)}
                disabled={isSyncing}
              >
                Remove
              </Button>
            </div>
          );
        })
      ) : (
        <p>No milestones entered</p>
      )}
    </div>
  );
}

const transformMilestonesForChart = (milestones: ClientMilestone[]) =>
  milestones.map((m) => ({
    name: m.name,
    days: getDiffInDays(new Date(m.timestamp)),
  }));

function getColorString(idx: number, total: number) {
  return `hsl(${Math.floor((idx / total) * 360)}deg 70% 50%)`;
}
