import { memo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Star, TrendingUp, Package, Clock, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Vendor } from '@/types/vendor';

interface VendorComparisonProps {
  vendors: Vendor[];
  open: boolean;
  onClose: () => void;
}

interface ComparisonField {
  key: keyof Vendor;
  label: string;
  format: (value: any) => string;
  icon?: React.ReactNode;
  higherIsBetter?: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount || 0);
};

const VendorComparison = memo(({ vendors, open, onClose }: VendorComparisonProps) => {
  if (vendors.length === 0) return null;

  const comparisonFields: ComparisonField[] = [
    {
      key: 'status',
      label: 'Status',
      format: (v: string) => v?.toUpperCase() || 'N/A',
      higherIsBetter: undefined,
    },
    {
      key: 'rating',
      label: 'Rating',
      format: (v: number) => v ? `${v.toFixed(1)} / 5.0` : 'N/A',
      icon: <Star className="w-4 h-4 text-yellow-500" />,
      higherIsBetter: true,
    },
    {
      key: 'total_orders',
      label: 'Total Orders',
      format: (v: number) => v ? v.toString() : '0',
      icon: <Package className="w-4 h-4 text-blue-500" />,
      higherIsBetter: true,
    },
    {
      key: 'total_value',
      label: 'Total Value',
      format: (v: number) => formatCurrency(v),
      icon: <DollarSign className="w-4 h-4 text-green-500" />,
      higherIsBetter: true,
    },
    {
      key: 'completion_rate',
      label: 'Completion Rate',
      format: (v: number) => v ? `${v}%` : 'N/A',
      icon: <TrendingUp className="w-4 h-4 text-purple-500" />,
      higherIsBetter: true,
    },
    {
      key: 'average_lead_time_days',
      label: 'Avg Lead Time',
      format: (v: number) => v ? `${v} hari` : 'N/A',
      icon: <Clock className="w-4 h-4 text-orange-500" />,
      higherIsBetter: false,
    },
    {
      key: 'payment_terms',
      label: 'Payment Terms',
      format: (v: any) => {
        if (!v) return 'N/A';
        if (typeof v === 'string') return v;
        if (typeof v === 'object') {
          return v.terms || v.method || 'N/A';
        }
        return 'N/A';
      },
      higherIsBetter: undefined,
    },
    {
      key: 'company_size',
      label: 'Company Size',
      format: (v: string) => {
        const sizeMap: Record<string, string> = {
          small: 'Small',
          medium: 'Medium',
          large: 'Large',
        };
        return sizeMap[v] || 'N/A';
      },
      higherIsBetter: undefined,
    },
  ];

  const getBestValue = (field: ComparisonField) => {
    if (field.higherIsBetter === undefined) return null;

    const values = vendors
      .map((v) => v[field.key] as number)
      .filter((v) => v != null && !isNaN(v));

    if (values.length === 0) return null;

    return field.higherIsBetter 
      ? Math.max(...values)
      : Math.min(...values);
  };

  const isBestValue = (vendor: Vendor, field: ComparisonField): boolean => {
    const bestValue = getBestValue(field);
    if (bestValue === null) return false;

    const vendorValue = vendor[field.key] as number;
    return vendorValue === bestValue && vendorValue != null;
  };

  const getStatusVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent 
        className="max-w-6xl max-h-[90vh] overflow-y-auto"
        aria-labelledby="comparison-title"
        aria-describedby="comparison-description"
      >
        <DialogHeader>
          <DialogTitle id="comparison-title" className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Perbandingan Vendor
          </DialogTitle>
          <DialogDescription id="comparison-description">
            Membandingkan {vendors.length} vendor secara side-by-side berdasarkan metrik kunci
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 dark:border-gray-700">
                <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300 min-w-[180px] sticky left-0 bg-white dark:bg-gray-900 z-10">
                  Metrik
                </th>
                {vendors.map((vendor) => (
                  <th 
                    key={vendor.id} 
                    className="text-center p-3 min-w-[160px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {vendor.name}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {vendor.company || vendor.email}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonFields.map((field, idx) => (
                <tr 
                  key={field.key} 
                  className={cn(
                    "border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors",
                    idx % 2 === 0 && "bg-gray-50/50 dark:bg-gray-800/30"
                  )}
                >
                  <td className="p-3 font-medium text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-900 z-10">
                    <div className="flex items-center gap-2">
                      {field.icon}
                      <span>{field.label}</span>
                    </div>
                  </td>
                  {vendors.map((vendor) => {
                    const value = vendor[field.key];
                    const formattedValue = field.format(value);
                    const isBest = isBestValue(vendor, field);
                    
                    return (
                      <td
                        key={vendor.id}
                        className={cn(
                          'text-center p-3 transition-all',
                          isBest && 'bg-green-50 dark:bg-green-900/20'
                        )}
                      >
                        {field.key === 'status' ? (
                          <div className="flex justify-center">
                            <Badge variant={getStatusVariant(value as string)}>
                              {formattedValue}
                            </Badge>
                          </div>
                        ) : (
                          <span 
                            className={cn(
                              'text-gray-900 dark:text-gray-100',
                              isBest && 'font-bold text-green-700 dark:text-green-400'
                            )}
                          >
                            {formattedValue}
                            {isBest && field.higherIsBetter !== undefined && (
                              <span className="ml-1 text-xs">
                                ⭐
                              </span>
                            )}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>
              <strong>Catatan:</strong> Nilai terbaik ditandai dengan{' '}
              <span className="font-bold text-green-700 dark:text-green-400">warna hijau</span> dan ⭐
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
});

VendorComparison.displayName = 'VendorComparison';

export default VendorComparison;
