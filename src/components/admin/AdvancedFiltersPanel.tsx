import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Filter, X, ChevronDown } from 'lucide-react';
import type { ProductFilters } from '@/types/product';
import { cn } from '@/lib/utils';

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

  const activeFiltersCount = Object.entries(filters).filter(([key, value]) => {
    if (key === 'page' || key === 'per_page' || key === 'search') return false;
    return value !== undefined && value !== '' && value !== null;
  }).length;

  const handleLocalFilterChange = (key: keyof ProductFilters, value: any) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value,
    }));
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
    onClearFilters();
    setOpen(false);
  };

  const priceRange = {
    min: localFilters.priceMin ?? 0,
    max: localFilters.priceMax ?? 10000000,
  };

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
            {/* Price Range */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Price Range (IDR)</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="price-min" className="text-xs text-muted-foreground">
                    Min
                  </Label>
                  <Input
                    id="price-min"
                    type="number"
                    min="0"
                    value={localFilters.priceMin ?? ''}
                    onChange={(e) => handleLocalFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
                <div>
                  <Label htmlFor="price-max" className="text-xs text-muted-foreground">
                    Max
                  </Label>
                  <Input
                    id="price-max"
                    type="number"
                    min="0"
                    value={localFilters.priceMax ?? ''}
                    onChange={(e) => handleLocalFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
                    placeholder="No limit"
                    className="h-9"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Stock Status */}
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

            {/* Featured */}
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

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category-filter" className="text-sm font-medium">
                Category
              </Label>
              <select
                id="category-filter"
                value={localFilters.category || ''}
                onChange={(e) => handleLocalFilterChange('category', e.target.value || undefined)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">All Categories</option>
                <option value="etching">Etching</option>
                <option value="engraving">Engraving</option>
                <option value="custom">Custom</option>
                <option value="award">Awards</option>
              </select>
            </div>

            <Separator />

            {/* Status */}
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

            {/* Sort Options */}
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
