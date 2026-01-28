import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Loader2, 
  Clock, 
  TrendingUp, 
  User, 
  Package, 
  ShoppingCart,
  Building2,
  Filter,
  X,
  ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { toast } from 'sonner';

interface SearchResult {
  id: string;
  type: 'order' | 'customer' | 'vendor' | 'product';
  title: string;
  subtitle: string;
  description?: string;
  metadata?: Record<string, any>;
  relevanceScore: number;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface SearchSuggestion {
  text: string;
  type: 'recent' | 'trending' | 'completion';
  count?: number;
}

interface SmartSearchProps {
  placeholder?: string;
  className?: string;
  onResultSelect?: (result: SearchResult) => void;
  showFilters?: boolean;
  maxResults?: number;
  categories?: string[];
}

export function SmartSearch({
  placeholder = "Search orders, customers, vendors, products...",
  className,
  onResultSelect,
  showFilters = true,
  maxResults = 10,
  categories = ['all', 'orders', 'customers', 'vendors', 'products']
}: SmartSearchProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [activeFilters, setActiveFilters] = useState<string[]>(['all']);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query to avoid excessive API calls
  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('smart_search_recent');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.warn('Failed to parse recent searches:', e);
      }
    }
  }, []);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.length >= 2) {
      performSearch(debouncedQuery);
    } else {
      setResults([]);
      if (debouncedQuery.length === 0) {
        loadSuggestions();
      }
    }
  }, [debouncedQuery, activeFilters]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleResultSelect(results[selectedIndex]);
          } else if (query.trim()) {
            handleSearch(query);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, results, query]);

  // Handle clicks outside to close search
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    
    try {
      const filterParams = activeFilters.includes('all') 
        ? '' 
        : `&types=${activeFilters.join(',')}`;
      
      const response = await fetch(
        `/api/admin/smart-search?q=${encodeURIComponent(searchQuery)}${filterParams}&limit=${maxResults}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setResults(data.data.results || []);
        setSuggestions(data.data.suggestions || []);
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
      setResults([]);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/admin/search-suggestions', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setSuggestions(data.data.suggestions || []);
        }
      }
    } catch (error) {
      console.error('Failed to load suggestions:', error);
    }
  };

  const handleResultSelect = (result: SearchResult) => {
    // Add to recent searches
    const newRecent = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('smart_search_recent', JSON.stringify(newRecent));

    // Close search
    setIsOpen(false);
    setSelectedIndex(-1);
    setQuery('');

    // Handle selection
    if (onResultSelect) {
      onResultSelect(result);
    } else {
      // Default behavior: navigate to result URL
      window.location.href = result.url;
    }
  };

  const handleSearch = (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    // Add to recent searches
    const newRecent = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10);
    setRecentSearches(newRecent);
    localStorage.setItem('smart_search_recent', JSON.stringify(newRecent));

    // Perform search
    performSearch(searchQuery);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text);
    inputRef.current?.focus();
    performSearch(suggestion.text);
  };

  const handleFilterToggle = (filter: string) => {
    if (filter === 'all') {
      setActiveFilters(['all']);
    } else {
      const newFilters = activeFilters.includes(filter)
        ? activeFilters.filter(f => f !== filter)
        : [...activeFilters.filter(f => f !== 'all'), filter];
      
      setActiveFilters(newFilters.length === 0 ? ['all'] : newFilters);
    }
  };

  const clearFilters = () => {
    setActiveFilters(['all']);
  };

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'order': return ShoppingCart;
      case 'customer': return User;
      case 'vendor': return Building2;
      case 'product': return Package;
      default: return Search;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'customer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'vendor': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'product': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div ref={searchRef} className={cn("relative w-full max-w-2xl", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-12"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {query && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setQuery('');
              setResults([]);
              inputRef.current?.focus();
            }}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <Card className="absolute top-full left-0 right-0 mt-1 z-50 max-h-96 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Filters */}
            {showFilters && (
              <div className="p-3 border-b bg-muted/50">
                <div className="flex items-center gap-2 flex-wrap">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  {categories.map((category) => (
                    <Button
                      key={category}
                      variant={activeFilters.includes(category) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFilterToggle(category)}
                      className="h-6 text-xs"
                    >
                      {t(`search.filters.${category}`, category)}
                    </Button>
                  ))}
                  {activeFilters.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFilters}
                      className="h-6 text-xs text-muted-foreground"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div ref={resultsRef} className="max-h-80 overflow-y-auto">
              {/* Search Results */}
              {results.length > 0 && (
                <div className="p-2">
                  <div className="text-xs text-muted-foreground mb-2 px-2">
                    {results.length} result{results.length !== 1 ? 's' : ''} found
                  </div>
                  {results.map((result, index) => {
                    const Icon = result.icon || getResultIcon(result.type);
                    const isSelected = index === selectedIndex;
                    
                    return (
                      <div
                        key={result.id}
                        onClick={() => handleResultSelect(result)}
                        className={cn(
                          "flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                          isSelected 
                            ? "bg-primary/10 border border-primary/20" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <div className="flex-shrink-0 mt-1">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm truncate">
                              {result.title}
                            </span>
                            <Badge 
                              variant="secondary" 
                              className={cn("text-xs", getTypeColor(result.type))}
                            >
                              {result.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {result.subtitle}
                          </div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* No Results */}
              {query.length >= 2 && results.length === 0 && !isLoading && (
                <div className="p-4 text-center text-muted-foreground">
                  <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <div className="text-sm">No results found for "{query}"</div>
                  <div className="text-xs mt-1">Try adjusting your search terms or filters</div>
                </div>
              )}

              {/* Suggestions */}
              {(suggestions.length > 0 || recentSearches.length > 0) && query.length < 2 && (
                <div className="p-2">
                  {/* Recent Searches */}
                  {recentSearches.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-2">
                        <Clock className="h-3 w-3" />
                        Recent searches
                      </div>
                      {recentSearches.slice(0, 5).map((search, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick({ text: search, type: 'recent' })}
                          className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 text-sm"
                        >
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="flex-1">{search}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Trending/Popular Suggestions */}
                  {suggestions.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 px-2">
                        <TrendingUp className="h-3 w-3" />
                        Popular searches
                      </div>
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-muted/50 text-sm"
                        >
                          <TrendingUp className="h-3 w-3 text-muted-foreground" />
                          <span className="flex-1">{suggestion.text}</span>
                          {suggestion.count && (
                            <Badge variant="secondary" className="text-xs">
                              {suggestion.count}
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Hook for using smart search functionality
export function useSmartSearch() {
  const [isSearching, setIsSearching] = useState(false);

  const search = async (query: string, filters: string[] = ['all']): Promise<SearchResult[]> => {
    setIsSearching(true);
    
    try {
      const filterParams = filters.includes('all') 
        ? '' 
        : `&types=${filters.join(',')}`;
      
      const response = await fetch(
        `/api/admin/smart-search?q=${encodeURIComponent(query)}${filterParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      if (data.success) {
        return data.data.results || [];
      } else {
        throw new Error(data.message || 'Search failed');
      }
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
      return [];
    } finally {
      setIsSearching(false);
    }
  };

  return {
    search,
    isSearching
  };
}

export type { SearchResult, SearchSuggestion };