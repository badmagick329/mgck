import { getDiffInDays } from '@/lib/milestones';
import { ClientMilestone } from '@/lib/types/milestones';
import { memo, useRef } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelProps,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const MilestonesChart = memo(function MilestonesChart({
  milestones,
}: {
  milestones: ClientMilestone[];
}) {
  const chartData = transformMilestonesForChart(milestones);
  const maxLabelLength = Math.max(...chartData.map((d) => d.name.length));
  const yAxisWidth = maxLabelLength * 8;
  const chartHeight = Math.max(200, chartData.length * 65);
  const renderCount = useRef(0);
  renderCount.current++;
  console.log(renderCount.current);

  return (
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
  );
});

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
export default MilestonesChart;
