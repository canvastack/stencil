import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface VendorPerformanceTableProps {
  vendors: {
    id: string;
    name: string;
    totalOrders: number;
    onTimeDeliveryRate: number;
    avgProductionTime: number;
    qualityScore: number;
    status: 'active' | 'inactive';
  }[];
  onVendorClick: (vendorId: string) => void;
  loading?: boolean;
  pagination?: {
    currentPage: number;
    perPage: number;
    total: number;
    lastPage: number;
  };
  onPageChange?: (page: number) => void;
}

type SortField = 'name' | 'totalOrders' | 'onTimeDeliveryRate' | 'avgProductionTime' | 'qualityScore';
type SortOrder = 'asc' | 'desc';

export function VendorPerformanceTable({
  vendors,
  onVendorClick,
  loading,
  pagination,
  onPageChange,
}: VendorPerformanceTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('totalOrders');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Filter and sort vendors
  const filteredVendors = vendors
    .filter((vendor) =>
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const multiplier = sortOrder === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return aValue.localeCompare(bValue) * multiplier;
      }
      
      return ((aValue as number) - (bValue as number)) * multiplier;
    });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-10 w-64" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Vendor Performance</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-8 px-2"
                  >
                    Vendor Name
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('totalOrders')}
                    className="h-8 px-2"
                  >
                    Orders
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('onTimeDeliveryRate')}
                    className="h-8 px-2"
                  >
                    On-Time %
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('avgProductionTime')}
                    className="h-8 px-2"
                  >
                    Avg Time
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('qualityScore')}
                    className="h-8 px-2"
                  >
                    Quality
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </Button>
                </TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No vendors found
                  </TableCell>
                </TableRow>
              ) : (
                filteredVendors.map((vendor) => (
                  <TableRow
                    key={vendor.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onVendorClick(vendor.id)}
                  >
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell className="text-right">{vendor.totalOrders}</TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          vendor.onTimeDeliveryRate >= 90
                            ? 'text-green-600 font-semibold'
                            : vendor.onTimeDeliveryRate >= 75
                            ? 'text-orange-600'
                            : 'text-red-600'
                        }
                      >
                        {vendor.onTimeDeliveryRate.toFixed(1)}%
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {vendor.avgProductionTime.toFixed(1)} days
                    </TableCell>
                    <TableCell className="text-right">
                      {vendor.qualityScore.toFixed(1)}/5
                    </TableCell>
                    <TableCell>
                      <Badge variant={vendor.status === 'active' ? 'default' : 'secondary'}>
                        {vendor.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && onPageChange && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.currentPage - 1) * pagination.perPage) + 1} to{' '}
              {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} of{' '}
              {pagination.total} vendors
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="text-sm">
                Page {pagination.currentPage} of {pagination.lastPage}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.lastPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
