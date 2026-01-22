import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import type { GeographicDistributionEntry } from '@/types/tenant-url';

/**
 * Props untuk GeographicTable component
 */
interface Props {
  data: GeographicDistributionEntry[] | undefined;
}

/**
 * GeographicTable Component
 * 
 * Table untuk menampilkan distribusi geografis URL accesses.
 * Menampilkan flag emoji negara, nama negara, jumlah akses, dan progress bar percentage.
 * 
 * @component
 * @example
 * ```tsx
 * <GeographicTable data={geographicData} />
 * ```
 * 
 * @param {Props} props - Component props
 * @param {GeographicDistributionEntry[] | undefined} props.data - Data distribusi geografis dari API
 * 
 * @returns {JSX.Element} Table dengan geographic distribution data
 */
export default function GeographicTable({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        No geographic data available
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Country</TableHead>
          <TableHead className="text-right">Accesses</TableHead>
          <TableHead className="w-[200px]">Distribution</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((entry) => (
          <TableRow key={entry.country_code}>
            <TableCell className="font-medium">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getFlagEmoji(entry.country_code)}</span>
                <span>{entry.country_name}</span>
              </div>
            </TableCell>
            <TableCell className="text-right">{entry.access_count.toLocaleString()}</TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Progress value={entry.percentage} className="flex-1" />
                <span className="text-sm text-muted-foreground w-12 text-right">
                  {entry.percentage.toFixed(1)}%
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) {
    return '🌍';
  }
  
  return countryCode
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}
