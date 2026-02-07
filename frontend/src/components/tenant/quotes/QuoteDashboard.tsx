import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { quoteService, QuoteListParams } from '@/services/tenant/quoteService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QuoteFilters } from './QuoteFilters';
import { QuoteTable } from './QuoteTable';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface QuoteDashboardProps {
  showHeader?: boolean;
  showCreateButton?: boolean;
  compactView?: boolean;
}

export const QuoteDashboard = ({ 
  showHeader = true, 
  showCreateButton = true,
  compactView = false 
}: QuoteDashboardProps) => {
  const [filters, setFilters] = useState<QuoteListParams>({
    page: 1,
    per_page: 20,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // Fetch quotes with React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['quotes', filters],
    queryFn: () => quoteService.getQuotes(filters),
    keepPreviousData: true,
  });

  const handleFilterChange = (newFilters: Partial<QuoteListParams>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      // Reset to page 1 when filters change (except pagination)
      page: newFilters.page !== undefined ? newFilters.page : 1,
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handlePerPageChange = (perPage: number) => {
    setFilters(prev => ({ ...prev, per_page: perPage, page: 1 }));
  };

  const handleSort = (sortBy: QuoteListParams['sort_by']) => {
    setFilters(prev => ({
      ...prev,
      sort_by: sortBy,
      sort_order: prev.sort_by === sortBy && prev.sort_order === 'asc' ? 'desc' : 'asc',
    }));
  };

  const quotes = data?.data || [];
  const pagination = data?.meta || {
    current_page: 1,
    last_page: 1,
    per_page: 20,
    total: 0,
  };

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">
              {error instanceof Error ? error.message : 'Failed to load quotes'}
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Quote Management</h2>
            <p className="text-muted-foreground">
              Manage vendor quotes and pricing negotiations
            </p>
          </div>
          {showCreateButton && (
            <Button asChild>
              <Link to="/admin/quotes/new">
                <Plus className="w-4 h-4 mr-2" />
                New Quote
              </Link>
            </Button>
          )}
        </div>
      )}

      {/* Filters */}
      <QuoteFilters 
        filters={filters} 
        onFilterChange={handleFilterChange}
      />

      {/* Quotes Table */}
      <QuoteTable
        quotes={quotes}
        loading={isLoading}
        onSort={handleSort}
        currentSort={{
          sortBy: filters.sort_by,
          sortOrder: filters.sort_order,
        }}
        compactView={compactView}
      />

      {/* Pagination */}
      {pagination.last_page > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Showing {((pagination.current_page - 1) * pagination.per_page) + 1} to{' '}
                  {Math.min(pagination.current_page * pagination.per_page, pagination.total)} of{' '}
                  {pagination.total} quotes
                </span>
                <Select 
                  value={pagination.per_page.toString()} 
                  onValueChange={(value) => handlePerPageChange(parseInt(value))}
                >
                  <SelectTrigger className="w-20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.current_page > 1) {
                          handlePageChange(pagination.current_page - 1);
                        }
                      }}
                      className={pagination.current_page === 1 ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                  
                  {Array.from({ length: Math.min(5, pagination.last_page) }, (_, i) => {
                    const page = Math.max(1, pagination.current_page - 2) + i;
                    if (page > pagination.last_page) return null;
                    
                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(page);
                          }}
                          isActive={page === pagination.current_page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}
                  
                  <PaginationItem>
                    <PaginationNext 
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (pagination.current_page < pagination.last_page) {
                          handlePageChange(pagination.current_page + 1);
                        }
                      }}
                      className={pagination.current_page === pagination.last_page ? 'pointer-events-none opacity-50' : ''}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
