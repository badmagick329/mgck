import { getDiffIn } from '@/lib/milestones';
import { ClientMilestone, DiffPeriod } from '@/lib/types/milestones';
import { memo, useEffect, useState } from 'react';
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
  diffPeriod,
}: {
  milestones: ClientMilestone[];
  diffPeriod: DiffPeriod;
}) {
  const [chartData, setChartData] = useState(
    transformMilestonesForChart(milestones, diffPeriod)
  );
  const maxLabelLength = Math.max(...chartData.map((d) => d.name.length));
  const yAxisWidth = maxLabelLength * 8;
  const chartHeight = Math.max(200, chartData.length * 65);
  useEffect(() => {
    setChartData(transformMilestonesForChart(milestones, diffPeriod));
  }, [diffPeriod, milestones]);

  return (
    <div className='pointer-events-none mx-auto flex w-full flex-col items-center gap-2 rounded-md'>
      <ResponsiveContainer width='100%' height={chartHeight}>
        <BarChart data={chartData} layout='vertical' barCategoryGap={2}>
          <XAxis type='number' />
          <YAxis type='category' width={yAxisWidth} dataKey='name' />
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

const transformMilestonesForChart = (
  milestones: ClientMilestone[],
  diffPeriod: DiffPeriod
) =>
  milestones.map((m) => ({
    name: m.name,
    days: getDiffIn(new Date(m.timestamp), diffPeriod),
    color: m.color,
  }));

const CustomLabel = (props: LabelProps) => {
  const { x, y, width, height, value } = props;

  if (
    x === undefined ||
    y === undefined ||
    value === null ||
    typeof value !== 'number' ||
    width === undefined ||
    height === undefined
  ) {
    return null;
  }
  if (!value) return null;

  const padding = { x: 8, y: 4 };
  const fontSize = 14;
  const formattedVal = formatNumberWithCommas(value);
  const textWidth = String(formattedVal).length * 8;
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
        fill='oklch(0.35 0 315)'
        rx={4}
        ry={4}
      />
      <text
        x={labelX}
        y={labelY}
        fill='oklch(0.9 0 315)'
        fontSize={fontSize}
        textAnchor='middle'
        dominantBaseline='middle'
        fontWeight='bold'
      >
        {formattedVal}
      </text>
    </g>
  );
};

const formatNumberWithCommas = (n: number): string => {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

export default MilestonesChart;
