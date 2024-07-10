'use client';

import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Result } from '@/hooks/use-choices-state';
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: '#2563eb',
  },
  mobile: {
    label: 'Mobile',
    color: '#60a5fa',
  },
} satisfies ChartConfig;

export default function ChartOutput({ chartData }: { chartData: Result[] }) {
  if (chartData.length === 0) {
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
          axisLine={false}
          tickFormatter={(value) => value.slice(0, 3)}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey='score' fill='var(--color-desktop)' radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
