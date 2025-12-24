'use client';
import { Button } from '@/components/ui/button';
import { getDiffInDays, getLocalDatetimeDisplay } from '@/lib/milestones';
import { ClientMilestone } from '@/lib/types/milestones';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
  LabelProps,
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
  const chartHeight = Math.max(200, chartData.length * 65);
  return (
    <div className='mx-auto flex w-full max-w-2xl flex-col gap-4'>
      <div className='mx-auto flex w-full flex-col items-center gap-2'>
        <ResponsiveContainer width='100%' height={chartHeight}>
          <BarChart data={chartData} layout='vertical' barCategoryGap={2}>
            <XAxis type='number' />
            <YAxis type='category' width={yAxisWidth} dataKey='name' />
            <Legend />
            <Bar dataKey='days' radius={[0, 4, 4, 0]} label={<CustomLabel />}>
              {chartData.map((item) => (
                <Cell key={`${item.name}`} fill={`${item.color}`} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {milestones.length > 0 ? (
        milestones.map((m) => {
          const date = new Date(m.timestamp);
          return (
            <div key={m.name} className='flex justify-between gap-2'>
              <div className='flex items-center gap-2'>
                <span>{m.name}</span>
                <span>{getLocalDatetimeDisplay(date, m.timezone)}</span>
                <span>({getDiffInDays(date)})</span>
              </div>
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
    color: m.color,
  }));

const CustomLabel = (props: LabelProps) => {
  const { x, y, width, height, value } = props;

  if (
    x === undefined ||
    y === undefined ||
    value === null ||
    width === undefined ||
    height === undefined
  ) {
    return null;
  }
  if (!value) return null;

  const padding = { x: 8, y: 4 };
  const fontSize = 14;
  const textWidth = String(value).length * 8;
  const bgWidth = textWidth + padding.x * 2;
  const bgHeight = fontSize + padding.y * 2;
  const isSmallBar = Number(width) < bgWidth + 16;

  const labelX = isSmallBar
    ? Number(x) + Number(width) + bgWidth / 2 + 8
    : Number(x) + Number(width) / 2;

  const labelY = Number(y) + Number(height) / 2;

  return (
    <g>
      <rect
        x={labelX - bgWidth / 2}
        y={labelY - bgHeight / 2 - 1}
        width={bgWidth}
        height={bgHeight}
        fill='hsl(0 4% 30%)'
        rx={4}
        ry={4}
      />
      <text
        x={labelX}
        y={labelY}
        fill='white'
        fontSize={fontSize}
        textAnchor='middle'
        dominantBaseline='middle'
        fontWeight='bold'
      >
        {value}
      </text>
    </g>
  );
};
