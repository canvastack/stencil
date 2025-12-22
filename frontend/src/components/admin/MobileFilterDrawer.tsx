import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import { darkModeClasses } from '@/lib/utils/darkMode';
import { touchTargets } from '@/hooks/useResponsive';
import { cn } from '@/lib/utils';
import { announceToScreenReader } from '@/lib/utils/accessibility';
import type { ProductFilters } from '@/types/product';

interface MobileFilterDrawerProps {
  filters: ProductFilters;
  onFiltersChange: (key: keyof ProductFilters, value: ProductFilters[keyof ProductFilters]) => void;
  onClear: () => void;
  categories?: Array<{ id: string; name: string }>;
}

export const MobileFilterDrawer: React.FC<MobileFilterDrawerProps> = ({
  filters,
  onFiltersChange,
  onClear,
  categories = [],
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category && filters.category !== 'all') count++;
    if (filters.status && filters.status !== 'all') count++;
    if (filters.featured !== undefined) count++;
    if (filters.inStock !== undefined) count++;
    return count;
  }, [filters]);

  const handleClearAll = () => {
    onClear();
    announceToScreenReader('All filters cleared');
  };

  const handleApplyFilters = () => {
    setIsOpen(false);
    announceToScreenReader(`${activeFiltersCount} filters applied`);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className={cn(
            'w-full',
            touchTargets.comfortable,
            darkModeClasses.input.default
          )}
          aria-label={`Open filters. ${activeFiltersCount} active filters`}
        >
          <Filter className="h-5 w-5 mr-2" aria-hidden="true" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge
              className="ml-2 bg-primary text-primary-foreground"
              aria-label={`${activeFiltersCount} active filters`}
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className={cn(
          'h-[90vh] flex flex-col',
          darkModeClasses.bg.primary,
          darkModeClasses.border.default
        )}
        aria-describedby="filter-drawer-description"
      >
        <SheetHeader>
          <SheetTitle className={darkModeClasses.text.primary}>
            Filter Products
          </SheetTitle>
          <SheetDescription id="filter-drawer-description" className={darkModeClasses.text.secondary}>
            Refine your product search with these filters
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 py-6 space-y-6 overflow-y-auto">
          <div>
            <Label
              htmlFor="mobile-search"
              className={cn('text-sm font-medium', darkModeClasses.text.primary)}
            >
              Search
            </Label>
            <Input
              id="mobile-search"
              type="search"
              role="searchbox"
              placeholder="Search products..."
              value={filters.search || ''}
              onChange={(e) => onFiltersChange('search', e.target.value)}
              className={cn(
                'mt-2',
                touchTargets.comfortable,
                darkModeClasses.input.default,
                darkModeClasses.input.focus
              )}
              aria-label="Search products by name, SKU, or description"
            />
          </div>

          <div>
            <Label
              htmlFor="mobile-category"
              className={cn('text-sm font-medium', darkModeClasses.text.primary)}
            >
              Category
            </Label>
            <Select
              value={filters.category || 'all'}
              onValueChange={(value) => onFiltersChange('category', value === 'all' ? undefined : value)}
            >
              <SelectTrigger
                id="mobile-category"
                className={cn(
                  'mt-2',
                  touchTargets.comfortable,
                  darkModeClasses.input.default
                )}
                aria-label="Select product category"
              >
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className={cn('text-sm font-medium', darkModeClasses.text.primary)}>
              Status
            </Label>
            <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Product status filter">
              {[
                { value: 'all', label: 'All' },
                { value: 'published', label: 'Published' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ].map((status) => (
                <Button
                  key={status.value}
                  variant={filters.status === status.value ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    'flex-1',
                    touchTargets.comfortable,
                    filters.status === status.value && darkModeClasses.bg.primary
                  )}
                  onClick={() => onFiltersChange('status', status.value === 'all' ? undefined : status.value)}
                  aria-pressed={filters.status === status.value}
                  aria-label={`Filter by ${status.label} status`}
                >
                  {status.label}
                </Button>
              ))}
            </div>
          </div>

          <div
            className={cn(
              'flex items-center justify-between py-4 px-4 rounded-lg',
              darkModeClasses.bg.secondary,
              darkModeClasses.border.default,
              'border'
            )}
          >
            <Label
              htmlFor="mobile-featured"
              className={cn('text-base font-medium cursor-pointer', darkModeClasses.text.primary)}
            >
              Featured Products Only
            </Label>
            <Switch
              id="mobile-featured"
              checked={filters.featured || false}
              onCheckedChange={(checked) => onFiltersChange('featured', checked ? true : undefined)}
              className={cn(
                touchTargets.minSize,
                'data-[state=checked]:bg-primary'
              )}
              aria-label="Toggle featured products filter"
            />
          </div>

          <div
            className={cn(
              'flex items-center justify-between py-4 px-4 rounded-lg',
              darkModeClasses.bg.secondary,
              darkModeClasses.border.default,
              'border'
            )}
          >
            <Label
              htmlFor="mobile-instock"
              className={cn('text-base font-medium cursor-pointer', darkModeClasses.text.primary)}
            >
              In Stock Only
            </Label>
            <Switch
              id="mobile-instock"
              checked={filters.inStock || false}
              onCheckedChange={(checked) => onFiltersChange('inStock', checked ? true : undefined)}
              className={cn(
                touchTargets.minSize,
                'data-[state=checked]:bg-primary'
              )}
              aria-label="Toggle in stock filter"
            />
          </div>
        </div>

        <SheetFooter className="flex-shrink-0 gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
          <Button
            variant="outline"
            size="lg"
            className={cn(
              'flex-1',
              touchTargets.comfortable,
              darkModeClasses.bg.secondary
            )}
            onClick={handleClearAll}
            disabled={activeFiltersCount === 0}
            aria-label="Clear all filters"
          >
            <X className="h-4 w-4 mr-2" aria-hidden="true" />
            Clear All
          </Button>
          <Button
            size="lg"
            className={cn('flex-1', touchTargets.comfortable)}
            onClick={handleApplyFilters}
            aria-label={`Apply ${activeFiltersCount} filters`}
          >
            Apply Filters
            {activeFiltersCount > 0 && ` (${activeFiltersCount})`}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
