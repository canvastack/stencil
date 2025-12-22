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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Bookmark, Plus, Trash2, Edit2, Check, X, Globe, Lock, Loader2, Copy } from 'lucide-react';
import type { ProductFilters } from '@/types/product';
import { SavedSearch } from '@/types/savedSearch';
import { savedSearchesService } from '@/services/api/savedSearches';
import { toast } from 'sonner';
import { announceToScreenReader } from '@/lib/utils/accessibility';

interface SavedSearchesProps {
  currentFilters: ProductFilters;
  onLoadSearch: (filters: ProductFilters) => void;
  className?: string;
}

export const SavedSearches: React.FC<SavedSearchesProps> = ({
  currentFilters,
  onLoadSearch,
  className,
}) => {
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [searchName, setSearchName] = useState('');
  const [searchDescription, setSearchDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSavedSearches();
  }, []);

  const loadSavedSearches = async () => {
    try {
      setIsLoading(true);
      const searches = await savedSearchesService.getSavedSearches();
      setSavedSearches(searches);
    } catch (error) {
      console.error('Failed to load saved searches:', error);
      toast.error('Failed to load saved searches');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveCurrentSearch = async () => {
    if (!searchName.trim()) {
      toast.error('Please enter a name for this search');
      return;
    }

    try {
      setIsSaving(true);
      const newSearch = await savedSearchesService.createSavedSearch({
        name: searchName.trim(),
        description: searchDescription.trim() || undefined,
        filters: {
          ...currentFilters,
          page: 1,
        },
        isPublic,
      });

      setSavedSearches([newSearch, ...savedSearches]);
      setShowSaveDialog(false);
      setSearchName('');
      setSearchDescription('');
      setIsPublic(false);
      toast.success(`Search "${newSearch.name}" saved successfully`);
      announceToScreenReader(`Search "${newSearch.name}" saved successfully`);
    } catch (error) {
      console.error('Failed to save search:', error);
      toast.error('Failed to save search');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSearch = async (search: SavedSearch) => {
    try {
      await savedSearchesService.incrementUsage(search.uuid);
      onLoadSearch(search.filters);
      toast.success(`Loaded search: ${search.name}`);
      announceToScreenReader(`Loaded search: ${search.name}`);
    } catch (error) {
      onLoadSearch(search.filters);
    }
  };

  const handleDeleteSearch = async (uuid: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the search "${name}"?`)) {
      return;
    }

    try {
      await savedSearchesService.deleteSavedSearch(uuid);
      setSavedSearches(savedSearches.filter(s => s.uuid !== uuid));
      toast.success(`Search "${name}" deleted`);
      announceToScreenReader(`Search "${name}" deleted`);
    } catch (error) {
      console.error('Failed to delete search:', error);
      toast.error('Failed to delete search');
    }
  };

  const handleRenameSearch = async (uuid: string, newName: string) => {
    if (!newName.trim()) {
      toast.error('Search name cannot be empty');
      return;
    }

    try {
      const updated = await savedSearchesService.updateSavedSearch(uuid, {
        name: newName.trim(),
      });
      setSavedSearches(savedSearches.map(s =>
        s.uuid === uuid ? updated : s
      ));
      setEditingId(null);
      setEditingName('');
      toast.success('Search renamed successfully');
      announceToScreenReader('Search renamed successfully');
    } catch (error) {
      console.error('Failed to rename search:', error);
      toast.error('Failed to rename search');
    }
  };

  const handleDuplicateSearch = async (uuid: string, name: string) => {
    try {
      const duplicated = await savedSearchesService.duplicateSavedSearch(
        uuid,
        `${name} (Copy)`
      );
      setSavedSearches([duplicated, ...savedSearches]);
      toast.success(`Search duplicated as "${duplicated.name}"`);
      announceToScreenReader(`Search duplicated as "${duplicated.name}"`);
    } catch (error) {
      console.error('Failed to duplicate search:', error);
      toast.error('Failed to duplicate search');
    }
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
          
          {isLoading ? (
            <div className="px-2 py-8 text-center">
              <Loader2 className="h-8 w-8 mx-auto mb-2 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Loading saved searches...</p>
            </div>
          ) : savedSearches.length === 0 ? (
            <div className="px-2 py-8 text-center text-sm text-muted-foreground">
              <Bookmark className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No saved searches yet</p>
              <p className="text-xs mt-1">Apply filters and save them for quick access</p>
            </div>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              {savedSearches.map((search) => (
                <div
                  key={search.uuid}
                  className="px-2 py-2 hover:bg-accent rounded-sm group"
                >
                  {editingId === search.uuid ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleRenameSearch(search.uuid, editingName);
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
                        onClick={() => handleRenameSearch(search.uuid, editingName)}
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
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{search.name}</span>
                            {search.isPublic ? (
                              <Globe className="h-3 w-3 text-muted-foreground" />
                            ) : (
                              <Lock className="h-3 w-3 text-muted-foreground" />
                            )}
                            {search.usageCount > 0 && (
                              <Badge variant="outline" className="text-xs px-1">
                                {search.usageCount}
                              </Badge>
                            )}
                          </div>
                          {search.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {search.description}
                            </div>
                          )}
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
                              handleDuplicateSearch(search.uuid, search.name);
                            }}
                            className="h-7 w-7 p-0"
                            aria-label={`Duplicate search "${search.name}"`}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(search.uuid);
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
                              handleDeleteSearch(search.uuid, search.name);
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
              Give this search a name and description so you and your team can quickly access it later.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search-name">
                Search Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="search-name"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                placeholder="e.g., Out of Stock Products"
                disabled={isSaving}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="search-description">Description (Optional)</Label>
              <Textarea
                id="search-description"
                value={searchDescription}
                onChange={(e) => setSearchDescription(e.target.value)}
                placeholder="Describe what this search is for..."
                rows={2}
                disabled={isSaving}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="is-public"
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked as boolean)}
                disabled={isSaving}
              />
              <Label
                htmlFor="is-public"
                className="text-sm font-normal cursor-pointer flex items-center gap-2"
              >
                <Globe className="h-3 w-3" />
                Make this search public (visible to all team members)
              </Label>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Current Filters</Label>
              <div className="text-sm p-3 bg-muted rounded-md max-h-32 overflow-y-auto">
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
                setSearchDescription('');
                setIsPublic(false);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCurrentSearch} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Search'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SavedSearches;
