import { useState, useMemo, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { ProductFilters } from '@/types/product';
import { cn } from '@/lib/utils';
import { DateRangeFilter } from './filters/DateRangeFilter';
import { PriceRangeFilter } from './filters/PriceRangeFilter';
import { MultiSelectFilter, type MultiSelectOption } from './filters/MultiSelectFilter';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

interface AdvancedFiltersPanelProps {
  filters: ProductFilters;
  onFiltersChange: (filters: ProductFilters) => void;
  onClearFilters: () => void;
}

export const AdvancedFiltersPanel: React.FC<AdvancedFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
}) => {
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<ProductFilters>(filters);
  
  const [createdDateRange, setCreatedDateRange] = useState<DateRange | undefined>(
    filters.createdAfter && filters.createdBefore
      ? {
          from: new Date(filters.createdAfter),
          to: new Date(filters.createdBefore),
        }
      : undefined
  );
  
  const [updatedDateRange, setUpdatedDateRange] = useState<DateRange | undefined>(
    filters.updatedAfter && filters.updatedBefore
      ? {
          from: new Date(filters.updatedAfter),
          to: new Date(filters.updatedBefore),
        }
      : undefined
  );

  useEffect(() => {
    setLocalFilters(filters);
    setCreatedDateRange(
      filters.createdAfter && filters.createdBefore
        ? { from: new Date(filters.createdAfter), to: new Date(filters.createdBefore) }
        : undefined
    );
    setUpdatedDateRange(
      filters.updatedAfter && filters.updatedBefore
        ? { from: new Date(filters.updatedAfter), to: new Date(filters.updatedBefore) }
        : undefined
    );
  }, [filters]);

  const activeFiltersCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'page' || key === 'per_page' || key === 'search') return false;
      if (Array.isArray(value)) return value.length > 0;
      return value !== undefined && value !== '' && value !== null;
    }).length;
  }, [filters]);

  const handleLocalFilterChange = (key: keyof ProductFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleCreatedDateRangeChange = (range?: DateRange) => {
    setCreatedDateRange(range);
    if (range?.from && range?.to) {
      setLocalFilters(prev => ({
        ...prev,
        createdAfter: format(range.from!, 'yyyy-MM-dd'),
        createdBefore: format(range.to!, 'yyyy-MM-dd'),
      }));
    } else {
      setLocalFilters(prev => {
        const { createdAfter, createdBefore, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleUpdatedDateRangeChange = (range?: DateRange) => {
    setUpdatedDateRange(range);
    if (range?.from && range?.to) {
      setLocalFilters(prev => ({
        ...prev,
        updatedAfter: format(range.from!, 'yyyy-MM-dd'),
        updatedBefore: format(range.to!, 'yyyy-MM-dd'),
      }));
    } else {
      setLocalFilters(prev => {
        const { updatedAfter, updatedBefore, ...rest } = prev;
        return rest;
      });
    }
  };

  const handleApplyFilters = () => {
    onFiltersChange({ ...localFilters, page: 1 });
    setOpen(false);
  };

  const handleResetFilters = () => {
    const resetFilters: ProductFilters = {
      page: 1,
      per_page: filters.per_page,
      search: filters.search,
    };
    setLocalFilters(resetFilters);
    setCreatedDateRange(undefined);
    setUpdatedDateRange(undefined);
    onClearFilters();
    setOpen(false);
  };

  const categoryOptions: MultiSelectOption[] = useMemo(
    () => [
      { label: 'Etching', value: 'etching', description: 'Chemical etching products' },
      { label: 'Engraving', value: 'engraving', description: 'Laser & mechanical engraving' },
      { label: 'Custom', value: 'custom', description: 'Custom fabrication' },
      { label: 'Awards', value: 'award', description: 'Trophy & award products' },
    ],
    []
  );

  const vendorOptions: MultiSelectOption[] = useMemo(
    () => [
      { label: 'Internal', value: 'internal', description: 'In-house production' },
      { label: 'Partner A', value: 'partner-a', description: 'External vendor' },
      { label: 'Partner B', value: 'partner-b', description: 'External vendor' },
    ],
    []
  );

  const tagOptions: MultiSelectOption[] = useMemo(
    () => [
      { label: 'New Arrival', value: 'new-arrival' },
      { label: 'Best Seller', value: 'best-seller' },
      { label: 'On Sale', value: 'on-sale' },
      { label: 'Limited Edition', value: 'limited-edition' },
    ],
    []
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          <span>Advanced Filters</span>
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetFilters}
                className="h-8 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            <DateRangeFilter
              label="Created Date"
              value={createdDateRange}
              onChange={handleCreatedDateRangeChange}
              placeholder="Select date range"
            />

            <Separator />

            <DateRangeFilter
              label="Updated Date"
              value={updatedDateRange}
              onChange={handleUpdatedDateRangeChange}
              placeholder="Select date range"
            />

            <Separator />

            <PriceRangeFilter
              label="Price Range"
              min={0}
              max={10000000}
              value={[localFilters.priceMin ?? 0, localFilters.priceMax ?? 10000000]}
              onChange={([min, max]) => {
                handleLocalFilterChange('priceMin', min === 0 ? undefined : min);
                handleLocalFilterChange('priceMax', max === 10000000 ? undefined : max);
              }}
              currency="IDR"
              step={10000}
            />

            <Separator />

            <MultiSelectFilter
              label="Categories"
              options={categoryOptions}
              value={localFilters.categories ?? []}
              onChange={(values) => handleLocalFilterChange('categories', values.length > 0 ? values : undefined)}
              placeholder="Select categories..."
              maxDisplay={3}
            />

            <Separator />

            <MultiSelectFilter
              label="Tags"
              options={tagOptions}
              value={localFilters.tags ?? []}
              onChange={(values) => handleLocalFilterChange('tags', values.length > 0 ? values : undefined)}
              placeholder="Select tags..."
              maxDisplay={3}
            />

            <Separator />

            <MultiSelectFilter
              label="Vendors"
              options={vendorOptions}
              value={localFilters.vendors ?? []}
              onChange={(values) => handleLocalFilterChange('vendors', values.length > 0 ? values : undefined)}
              placeholder="Select vendors..."
              maxDisplay={3}
            />

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Stock Status</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="in-stock"
                    checked={localFilters.inStock === true}
                    onCheckedChange={(checked) => 
                      handleLocalFilterChange('inStock', checked ? true : undefined)
                    }
                  />
                  <Label
                    htmlFor="in-stock"
                    className="text-sm font-normal cursor-pointer"
                  >
                    In Stock Only
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-sm font-medium">Product Type</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="featured"
                    checked={localFilters.featured === true}
                    onCheckedChange={(checked) => 
                      handleLocalFilterChange('featured', checked ? true : undefined)
                    }
                  />
                  <Label
                    htmlFor="featured"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Featured Products Only
                  </Label>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="status-filter" className="text-sm font-medium">
                Status
              </Label>
              <select
                id="status-filter"
                value={localFilters.status || ''}
                onChange={(e) => handleLocalFilterChange('status', e.target.value || undefined)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label htmlFor="sort-filter" className="text-sm font-medium">
                Sort By
              </Label>
              <select
                id="sort-filter"
                value={localFilters.sort || ''}
                onChange={(e) => handleLocalFilterChange('sort', e.target.value || undefined)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Default</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="created_at">Date Created</option>
                <option value="updated_at">Date Updated</option>
                <option value="stock_quantity">Stock</option>
              </select>
            </div>

            {localFilters.sort && (
              <div className="space-y-2">
                <Label htmlFor="order-filter" className="text-sm font-medium">
                  Sort Order
                </Label>
                <select
                  id="order-filter"
                  value={localFilters.order || 'asc'}
                  onChange={(e) => handleLocalFilterChange('order', e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <Separator />

        <div className="p-4 bg-muted/50 flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleApplyFilters}
            className="flex-1"
          >
            Apply Filters
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default AdvancedFiltersPanel;
