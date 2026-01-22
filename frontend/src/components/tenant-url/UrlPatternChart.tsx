import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

/**
 * Props untuk UrlPatternChart component
 */
interface Props {
  data:
    | {
        subdomain: number;
        path: number;
        custom_domain: number;
      }
    | undefined;
}

const COLORS = {
  subdomain: 'hsl(var(--chart-1))',
  path: 'hsl(var(--chart-2))',
  custom_domain: 'hsl(var(--chart-3))',
};

/**
 * UrlPatternChart Component
 * 
 * Pie chart untuk menampilkan distribusi penggunaan URL pattern.
 * Menunjukkan breakdown antara Subdomain, Path-Based, dan Custom Domain access.
 * 
 * @component
 * @example
 * ```tsx
 * <UrlPatternChart data={{ subdomain: 150, path: 50, custom_domain: 30 }} />
 * ```
 * 
 * @param {Props} props - Component props
 * @param {Object | undefined} props.data - Data distribusi pattern dari API
 * 
 * @returns {JSX.Element} Responsive pie chart dengan percentage labels
 */
export default function UrlPatternChart({ data }: Props) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No pattern data available
      </div>
    );
  }

  const chartData = [
    { name: 'Subdomain', value: data.subdomain, color: COLORS.subdomain },
    { name: 'Path-Based', value: data.path, color: COLORS.path },
    { name: 'Custom Domain', value: data.custom_domain, color: COLORS.custom_domain },
  ];

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  if (totalValue === 0) {
    return (
      <div className="flex items-center justify-center h-[250px] text-muted-foreground">
        No access data available
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
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
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
