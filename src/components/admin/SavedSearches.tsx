import { useState, useEffect } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bookmark, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import type { ProductFilters } from '@/types/product';
import { toast } from 'sonner';
import { announceToScreenReader } from '@/lib/utils/accessibility';

interface SavedSearch {
  id: string;
  name: string;
  filters: ProductFilters;
  createdAt: string;
}

interface SavedSearchesProps {
  currentFilters: ProductFilters;
  onLoadSearch: (filters: ProductFilters) => void;
  className?: string;
}

const STORAGE_KEY = 'product-catalog-saved-searches';

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  currentFilters,
  onLoadSearch,
  className,
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const searches = JSON.parse(stored) as SavedSearch[];
        setSavedSearches(searches);
      }
    } catch (error) {
      console.error('Failed to load saved searches:', error);
      toast.error('Failed to load saved searches');
    }
  };

  const saveSavedSearches = (searches: SavedSearch[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(searches));
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to save searches:', error);
      toast.error('Failed to save search');
    }
  };

  const handleSaveCurrentSearch = () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    const newSearch: SavedSearch = {
      id: Date.now().toString(),
      name: searchName.trim(),
      filters: {
        ...currentFilters,
        page: 1,
      },
      createdAt: new Date().toISOString(),
    };

    const updatedSearches = [...savedSearches, newSearch];
    saveSavedSearches(updatedSearches);

    setShowSaveDialog(false);
    setSearchName('');
    toast.success(`Search "${newSearch.name}" saved successfully`);
    announceToScreenReader(`Search "${newSearch.name}" saved successfully`);
  };

  const handleLoadSearch = (search: SavedSearch) => {
    onLoadSearch(search.filters);
    toast.success(`Loaded search: ${search.name}`);
    announceToScreenReader(`Loaded search: ${search.name}`);
  };

  const handleDeleteSearch = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the search "${name}"?`)) {
      const updatedSearches = savedSearches.filter(s => s.id !== id);
      saveSavedSearches(updatedSearches);
      toast.success(`Search "${name}" deleted`);
      announceToScreenReader(`Search "${name}" deleted`);
    }
  };

  const handleRenameSearch = (id: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Search name cannot be empty');
      return;
    }

    const updatedSearches = savedSearches.map(s =>
      s.id === id ? { ...s, name: newName.trim() } : s
    );
    saveSavedSearches(updatedSearches);
    setEditingId(null);
    setEditingName('');
    toast.success('Search renamed successfully');
    announceToScreenReader('Search renamed successfully');
  };

  const getFilterSummary = (filters: ProductFilters): string => {
    const parts: string[] = [];
    
    if (filters.category) parts.push(`Category: ${filters.category}`);
    if (filters.status) parts.push(`Status: ${filters.status}`);
    if (filters.featured) parts.push('Featured');
    if (filters.inStock) parts.push('In Stock');
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      parts.push(`Price: ${filters.priceMin ?? 0} - ${filters.priceMax ?? '∞'}`);
    }
    
    return parts.length > 0 ? parts.join(', ') : 'No filters';
  };

  const hasActiveFilters = () => {
    return Object.entries(currentFilters).some(([key, value]) => {
      if (key === 'page' || key === 'per_page' || key === 'search') return false;
      return value !== undefined && value !== '' && value !== null;
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className={className}>
            <Bookmark className="h-4 w-4 mr-2" />
            Saved Searches
            {savedSearches.length > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 min-w-5 px-1">
                {savedSearches.length}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[350px]">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Saved Searches</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSaveDialog(true)}
              disabled={!hasActiveFilters()}
              className="h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Save Current
            </Button>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          {savedSearches.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved searches yet</p>
              <p className="text-xs mt-1">Apply filters and save them for quick access</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {savedSearches.map((search) => (
                <div
                  key={search.id}
                  className="px-2 py-2 hover:bg-accent rounded-sm group"
                >
                  {editingId === search.id ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSearch(search.id, editingName);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditingName('');
                          }
                        }}
                        className="h-7 text-sm"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRenameSearch(search.id, editingName)}
                        className="h-7 w-7 p-0"
                      >
                        <Check className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingId(null);
                          setEditingName('');
                        }}
                        className="h-7 w-7 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2">
                        <button
                          onClick={() => handleLoadSearch(search)}
                          className="flex-1 text-left"
                        >
                          <div className="font-medium text-sm">{search.name}</div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {getFilterSummary(search.filters)}
                          </div>
                        </button>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(search.id);
                              setEditingName(search.name);
                            }}
                            className="h-7 w-7 p-0"
                            aria-label={`Rename search "${search.name}"`}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSearch(search.id, search.name);
                            }}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            aria-label={`Delete search "${search.name}"`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(search.createdAt).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Save Search Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Search</DialogTitle>
            <DialogDescription>
              Give this search a name so you can quickly access it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">Search Name</Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Published Featured Products"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveCurrentSearch();
                  }
                }}
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Current Filters</Label>
              <div className="text-sm p-3 bg-muted rounded-md">
                {getFilterSummary(currentFilters)}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowSaveDialog(false);
                setSearchName('');
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCurrentSearch}>
              Save Search
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SavedSearches;
