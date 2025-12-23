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
            <Bar dataKey='days' radius={[0, 4, 4, 0]}>
              <LabelList
                content={(props) =>
                  renderCustomizedLabel(
                    getLabelColor(chartData[props.index!]!.color),
                    props
                  )
                }
              />
              {chartData.map((item, idx) => (
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

const getColorString = (idx: number, total: number) =>
  `hsl(${Math.floor((idx / total) * 360)}deg 70% 50%)`;

const getLabelColor = (hexColor: string): string => {
  const hslColor = hexToHsl(hexColor);
  const match = hslColor.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
  if (!match) return 'white';

  const lightness = parseInt(match[3]);

  return lightness > 50 ? '#000000' : '#ffffff';
};

const hexToHsl = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return `hsl(0, 0%, ${Math.round(l * 100)}%)`;

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;

  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
};

const renderCustomizedLabel = (color: string, props: LabelProps) => {
  const { x, y, width, value, index } = props;

  if (x == null || y == null || width == null || index === undefined) {
    return null;
  }

  return (
    <text
      x={Number(x) + Number(width) / 2}
      y={Number(y) + 26}
      textAnchor='middle'
      dominantBaseline='middle'
      fill={color}
      fontWeight={'bold'}
    >
      {String(value)}
    </text>
  );
};
