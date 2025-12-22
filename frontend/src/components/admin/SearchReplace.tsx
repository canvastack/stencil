import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Replace, 
  X, 
  ChevronUp, 
  ChevronDown, 
  Check, 
  FileText,
  AlertCircle
} from 'lucide-react';

export interface SearchMatch {
  file: string;
  line: number;
  column: number;
  match: string;
  context: string;
}

interface SearchReplaceProps {
  files?: Array<{ path: string; content: string }>;
  onSearch?: (query: string, options: SearchOptions) => SearchMatch[];
  onReplace?: (matches: SearchMatch[], replacement: string) => void;
  onClose?: () => void;
}

export interface SearchOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  regex: boolean;
  includeFiles: string;
  excludeFiles: string;
}

export function SearchReplace({ files = [], onSearch, onReplace, onClose }: SearchReplaceProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [matches, setMatches] = useState<SearchMatch[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<Set<number>>(new Set());
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  
  const [options, setOptions] = useState<SearchOptions>({
    caseSensitive: false,
    wholeWord: false,
    regex: false,
    includeFiles: '*',
    excludeFiles: ''
  });

  const performSearch = useCallback(() => {
    if (!searchQuery) {
      setMatches([]);
      return;
    }

    if (onSearch) {
      const results = onSearch(searchQuery, options);
      setMatches(results);
      setCurrentMatchIndex(results.length > 0 ? 0 : -1);
      return;
    }

    const results: SearchMatch[] = [];
    const searchRegex = createSearchRegex(searchQuery, options);

    files.forEach(file => {
      if (!shouldIncludeFile(file.path, options)) {
        return;
      }

      const lines = file.content.split('\n');
      lines.forEach((line, lineIndex) => {
        let match;
        const regex = new RegExp(searchRegex, options.caseSensitive ? 'g' : 'gi');
        
        while ((match = regex.exec(line)) !== null) {
          results.push({
            file: file.path,
            line: lineIndex + 1,
            column: match.index + 1,
            match: match[0],
            context: line
          });
        }
      });
    });

    setMatches(results);
    setCurrentMatchIndex(results.length > 0 ? 0 : -1);
    setSelectedMatches(new Set());
  }, [searchQuery, options, files, onSearch]);

  const performReplace = useCallback(() => {
    if (onReplace) {
      const matchesToReplace = Array.from(selectedMatches).map(idx => matches[idx]);
      onReplace(matchesToReplace, replaceQuery);
      setMatches([]);
      setSelectedMatches(new Set());
      setSearchQuery('');
      setReplaceQuery('');
    }
  }, [matches, selectedMatches, replaceQuery, onReplace]);

  const navigateMatch = (direction: 'next' | 'prev') => {
    if (matches.length === 0) return;

    let newIndex = currentMatchIndex;
    if (direction === 'next') {
      newIndex = (currentMatchIndex + 1) % matches.length;
    } else {
      newIndex = currentMatchIndex === 0 ? matches.length - 1 : currentMatchIndex - 1;
    }
    setCurrentMatchIndex(newIndex);
  };

  const toggleMatchSelection = (index: number) => {
    const newSelected = new Set(selectedMatches);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedMatches(newSelected);
  };

  const selectAllMatches = () => {
    setSelectedMatches(new Set(matches.map((_, idx) => idx)));
  };

  const deselectAllMatches = () => {
    setSelectedMatches(new Set());
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search & Replace
            </CardTitle>
            <CardDescription>
              Find and replace text across your theme files
            </CardDescription>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="space-y-2">
          <Label>Search For</Label>
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && performSearch()}
              placeholder="Enter search query..."
              className="flex-1"
            />
            <Button onClick={performSearch}>
              <Search className="h-4 w-4 mr-2" />
              Find
            </Button>
          </div>
        </div>

        {/* Replace Input */}
        <div className="space-y-2">
          <Label>Replace With</Label>
          <div className="flex gap-2">
            <Input
              value={replaceQuery}
              onChange={(e) => setReplaceQuery(e.target.value)}
              placeholder="Enter replacement..."
              className="flex-1"
            />
            <Button 
              onClick={performReplace} 
              disabled={selectedMatches.size === 0}
            >
              <Replace className="h-4 w-4 mr-2" />
              Replace ({selectedMatches.size})
            </Button>
          </div>
        </div>

        {/* Search Options */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="caseSensitive"
              checked={options.caseSensitive}
              onCheckedChange={(checked) => 
                setOptions({ ...options, caseSensitive: checked as boolean })
              }
            />
            <label htmlFor="caseSensitive" className="text-sm cursor-pointer">
              Case sensitive
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="wholeWord"
              checked={options.wholeWord}
              onCheckedChange={(checked) => 
                setOptions({ ...options, wholeWord: checked as boolean })
              }
            />
            <label htmlFor="wholeWord" className="text-sm cursor-pointer">
              Whole word
            </label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="regex"
              checked={options.regex}
              onCheckedChange={(checked) => 
                setOptions({ ...options, regex: checked as boolean })
              }
            />
            <label htmlFor="regex" className="text-sm cursor-pointer">
              Use regex
            </label>
          </div>
        </div>

        <Separator />

        {/* Results */}
        {matches.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{matches.length} match{matches.length !== 1 ? 'es' : ''}</Badge>
                {currentMatchIndex >= 0 && (
                  <span className="text-sm text-muted-foreground">
                    {currentMatchIndex + 1} of {matches.length}
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={selectAllMatches}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllMatches}>
                  Deselect All
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMatch('prev')}>
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={() => navigateMatch('next')}>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="h-[400px] border rounded-md">
              <div className="p-2 space-y-2">
                {matches.map((match, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-md border cursor-pointer transition-colors ${
                      index === currentMatchIndex
                        ? 'bg-blue-50 border-blue-300'
                        : selectedMatches.has(index)
                        ? 'bg-green-50 border-green-300'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => toggleMatchSelection(index)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Checkbox
                          checked={selectedMatches.has(index)}
                          onCheckedChange={() => toggleMatchSelection(index)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm font-medium truncate">{match.file}</span>
                          <Badge variant="outline" className="ml-auto flex-shrink-0">
                            Line {match.line}:{match.column}
                          </Badge>
                        </div>
                        <code className="block text-xs bg-white p-2 rounded border overflow-x-auto">
                          {highlightMatch(match.context, match.match, searchQuery)}
                        </code>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {searchQuery && matches.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No matches found for "{searchQuery}"</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function createSearchRegex(query: string, options: SearchOptions): string {
  let pattern = query;
  
  if (!options.regex) {
    pattern = escapeRegex(query);
  }
  
  if (options.wholeWord) {
    pattern = `\\b${pattern}\\b`;
  }
  
  return pattern;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function shouldIncludeFile(filePath: string, options: SearchOptions): boolean {
  if (options.excludeFiles) {
    const excludePatterns = options.excludeFiles.split(',').map(p => p.trim());
    for (const pattern of excludePatterns) {
      if (matchesGlob(filePath, pattern)) {
        return false;
      }
    }
  }
  
  if (options.includeFiles && options.includeFiles !== '*') {
    const includePatterns = options.includeFiles.split(',').map(p => p.trim());
    return includePatterns.some(pattern => matchesGlob(filePath, pattern));
  }
  
  return true;
}

function matchesGlob(filePath: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regexPattern}$`).test(filePath);
}

function highlightMatch(context: string, match: string, query: string): React.ReactNode {
  if (!query) return context;
  
  const parts = context.split(new RegExp(`(${escapeRegex(match)})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === match.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 font-semibold">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}
