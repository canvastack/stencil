import { Progress } from '@/components/ui/progress';
import { ExternalLink } from 'lucide-react';
import type { TopReferrer } from '@/types/tenant-url';

/**
 * Props untuk ReferrersList component
 */
interface Props {
  data: TopReferrer[] | undefined;
}

/**
 * ReferrersList Component
 * 
 * List untuk menampilkan top referrers (traffic sources) untuk URL.
 * Menampilkan nama referrer, jumlah akses, percentage, dan progress bar.
 * 
 * @component
 * @example
 * ```tsx
 * <ReferrersList data={referrersData} />
 * ```
 * 
 * @param {Props} props - Component props
 * @param {TopReferrer[] | undefined} props.data - Data top referrers dari API
 * 
 * @returns {JSX.Element} List dengan referrer information dan progress bars
 */
export default function ReferrersList({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No referrer data available
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((referrer, index) => (
        <div key={index} className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="font-medium truncate">
                {referrer.referrer || 'Direct Traffic'}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-muted-foreground">{referrer.count.toLocaleString()}</span>
              <span className="text-muted-foreground">({referrer.percentage.toFixed(1)}%)</span>
            </div>
          </div>
          <Progress value={referrer.percentage} className="h-2" />
        </div>
      ))}
    </div>
  );
}
