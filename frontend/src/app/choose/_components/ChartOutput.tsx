'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
    <Card className='flex w-full flex-col items-center'>
      <CardHeader className='flex items-center justify-center'>
        <CardTitle>Choice Comparison</CardTitle>
        <CardDescription>Winner: {chartData[0].choice}</CardDescription>
      </CardHeader>
      <CardContent className='flex w-full'>
        <ChartContainer config={chartConfig} className='min-h-96 w-full'>
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
              label={{ fill: 'white', fontSize: 10 }}
              barSize={48}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
