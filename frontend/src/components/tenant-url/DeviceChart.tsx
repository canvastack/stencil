import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { DeviceBreakdown } from '@/types/tenant-url';

/**
 * Props untuk DeviceChart component
 */
interface Props {
  data: DeviceBreakdown | undefined;
}

const COLORS = {
  desktop: 'hsl(var(--chart-1))',
  mobile: 'hsl(var(--chart-2))',
  tablet: 'hsl(var(--chart-3))',
  bot: 'hsl(var(--chart-4))',
};

/**
 * DeviceChart Component
 * 
 * Donut chart untuk menampilkan breakdown URL accesses berdasarkan device type.
 * Menampilkan distribusi antara Desktop, Mobile, Tablet, dan Bot traffic.
 * 
 * @component
 * @example
 * ```tsx
 * <DeviceChart data={{ desktop: 150, mobile: 100, tablet: 30, bot: 10 }} />
 * ```
 * 
 * @param {Props} props - Component props
 * @param {DeviceBreakdown | undefined} props.data - Data device breakdown dari API
 * 
 * @returns {JSX.Element} Responsive donut chart dengan device distribution
 */
export default function DeviceChart({ data }: Props) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No device data available
      </div>
    );
  }

  const chartData = [
    { name: 'Desktop', value: data.desktop, color: COLORS.desktop },
    { name: 'Mobile', value: data.mobile, color: COLORS.mobile },
    { name: 'Tablet', value: data.tablet, color: COLORS.tablet },
    { name: 'Bot', value: data.bot, color: COLORS.bot },
  ];

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalValue === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No device data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          paddingAngle={5}
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: number) => value.toLocaleString()}
        />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
