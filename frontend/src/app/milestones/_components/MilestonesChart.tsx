import { getDiffIn } from '@/lib/milestones';
import { ClientMilestone, DiffPeriod } from '@/lib/types/milestones';
import { formatNumberWithCommas } from '@/lib/utils';
import { memo, useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  Cell,
  LabelProps,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from 'recharts';

const MilestonesChart = memo(function MilestonesChart({
  milestones,
  diffPeriod,
  hiddenMilestones,
}: {
  milestones: ClientMilestone[];
  diffPeriod: DiffPeriod;
  hiddenMilestones: string[] | undefined;
}) {
  const [chartData, setChartData] = useState(
    transformMilestonesForChart(milestones, diffPeriod, hiddenMilestones)
  );
  const maxLabelLength = Math.max(...chartData.map((d) => d.name.length));
  const yAxisWidth = maxLabelLength * 10;
  const chartHeight = Math.max(200, chartData.length * 65);
  useEffect(() => {
    setChartData(
      transformMilestonesForChart(milestones, diffPeriod, hiddenMilestones)
    );
  }, [diffPeriod, milestones, hiddenMilestones]);

  if (milestones.length === 0) {
    return (
      <p className='pb-8 pt-4 text-center'>
        No milestones to display. Add your first milestone to start tracking.
      </p>
    );
  }

  if (chartData.length === 0) {
    return (
      <div className='mx-auto flex w-full flex-col items-center gap-2 rounded-md pb-8 pt-4'>
        <p>Nothing to show</p>
      </div>
    );
  }

  return (
    <div className='pointer-events-none mx-auto flex w-full flex-col items-center gap-2 rounded-md'>
      {milestones.length === 1 && (
        <p className='pb-8 pt-4 text-center'>
          Try adding one more milestone to start comparing.
        </p>
      )}
      <ResponsiveContainer width='100%' height={chartHeight}>
        <BarChart data={chartData} layout='vertical' barCategoryGap={2}>
          <XAxis type='number' />
          <YAxis type='category' width={yAxisWidth} dataKey='name' />
          <Bar
            dataKey='period'
            radius={[0, 4, 4, 0]}
            label={(props) => (
              <CustomLabel
                {...props}
                diffPeriod={diffPeriod}
                timestamp={chartData[props.index!].timestamp}
              />
            )}
          >
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
  diffPeriod: DiffPeriod,
  hiddenMilestones: string[] | undefined
) => {
  const visibleMilestones = milestones.filter(
    (m) =>
      hiddenMilestones === undefined ||
      hiddenMilestones.length === 0 ||
      !hiddenMilestones.includes(m.name)
  );
  return visibleMilestones.map((m) => ({
    name: m.name,
    timestamp: m.timestamp,
    period: getDiffIn(new Date(m.timestamp), diffPeriod),
    color: m.color,
  }));
};

const CustomLabel = (
  props: LabelProps & { diffPeriod: DiffPeriod; timestamp: number }
) => {
  const { x, y, width, height, value, timestamp, diffPeriod } = props;
  const [calculatedValue, setCalculatedValue] = useState(
    getDiffIn(new Date(timestamp), diffPeriod)
  );
  useEffect(() => {
    let intervalPeriod = diffPeriod === 'seconds' ? 1000 : 10000;
    const interval = setInterval(
      () => setCalculatedValue(getDiffIn(new Date(timestamp), diffPeriod)),
      intervalPeriod
    );
    return () => clearInterval(interval);
  }, []);

  if (
    x === undefined ||
    y === undefined ||
    width === undefined ||
    height === undefined
  ) {
    return null;
  }
  if (!calculatedValue) return null;

  const padding = { x: 8, y: 4 };
  const fontSize = 14;
  const formattedVal = formatNumberWithCommas(calculatedValue);
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

export default MilestonesChart;
