'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Result } from '@/hooks/use-choices-state';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';

const chartConfig = {
  score: {
    label: 'Score',
    color: '#111827',
  },
} satisfies ChartConfig;

export default function ChartOutput({ chartData }: { chartData: Result[] }) {
  if (chartData.length <= 1) {
    return null;
  }

  return (
    <ChartContainer
      config={chartConfig}
      className='min-h-[200px] w-full md:max-w-[720px]'
    >
      <BarChart accessibilityLayer data={chartData}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey='choice'
          tickLine={false}
          tickMargin={10}
          axisLine={true}
          tickFormatter={(value) => value.slice(0, 4)}
        />
        <YAxis ticks={[0, 25, 50, 75, 100]} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey='score'
          fill='var(--color-score)'
          radius={2}
          label={{ fill: 'white', fontSize: 16 }}
          barSize={48}
        />
      </BarChart>
    </ChartContainer>
  );
}
