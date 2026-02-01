import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { exchangeRateService } from '@/services/api/exchangeRate';
import { ExchangeRateHistory as ExchangeRateHistoryType } from '@/types/exchangeRate';

export default function ExchangeRateHistory() {
  const [history, setHistory] = useState<ExchangeRateHistoryType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    provider: '',
    source: '' as '' | 'manual' | 'api',
  });

  useEffect(() => {
    loadHistory();
  }, [currentPage, filters]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await exchangeRateService.getHistory({
        ...filters,
        page: currentPage,
        per_page: 20,
      });
      setHistory(response.data);
      setCurrentPage(response.current_page);
      setLastPage(response.last_page);
      setTotal(response.total);
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadHistory();
  };

  const handleClearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      provider: '',
      source: '',
    });
    setCurrentPage(1);
  };

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Exchange Rate History</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>End Date</Label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input
              placeholder="Filter by provider"
              value={filters.provider}
              onChange={(e) => handleFilterChange('provider', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Source</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={filters.source}
              onChange={(e) =>
                handleFilterChange('source', e.target.value as '' | 'manual' | 'api')
              }
            >
              <option value="">All Sources</option>
              <option value="manual">Manual</option>
              <option value="api">API</option>
            </select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSearch}>
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Rate (USD → IDR)</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      No history records found
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((record) => (
                    <TableRow key={record.uuid}>
                      <TableCell>
                        {new Date(record.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-mono">
                        {record.rate.toLocaleString('en-US', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 6,
                        })}
                      </TableCell>
                      <TableCell>{record.provider}</TableCell>
                      <TableCell>
                        <Badge
                          variant={record.source === 'manual' ? 'secondary' : 'default'}
                        >
                          {record.source === 'manual' ? 'Manual' : 'API'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {lastPage > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {history.length} of {total} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {lastPage}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
