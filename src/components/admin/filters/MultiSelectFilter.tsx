import { useState, useMemo } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface MultiSelectOption {
  label: string;
  value: string;
  description?: string;
}

interface MultiSelectFilterProps {
  label: string;
  options: MultiSelectOption[];
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  maxDisplay?: number;
  disabled?: boolean;
  className?: string;
}

export const MultiSelectFilter = ({
  label,
  options,
  value,
  onChange,
  placeholder = 'Select options...',
  searchPlaceholder,
  emptyText,
  maxDisplay = 2,
  disabled = false,
  className,
}: MultiSelectFilterProps) => {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedLabels = useMemo(() => {
    return value
      .map((v) => options.find((opt) => opt.value === v)?.label)
      .filter(Boolean) as string[];
  }, [value, options]);

  const toggleOption = (optionValue: string) => {
    const newValue = value.includes(optionValue)
      ? value.filter((v) => v !== optionValue)
      : [...value, optionValue];
    onChange(newValue);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    
    const query = searchQuery.toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(query) ||
        option.description?.toLowerCase().includes(query)
    );
  }, [options, searchQuery]);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`multi-select-${label}`}>{label}</Label>
        {value.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            disabled={disabled}
            className="h-6 px-2 text-xs"
          >
            <X className="h-3 w-3 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`multi-select-${label}`}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
          >
            <div className="flex gap-1 flex-wrap">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : value.length <= maxDisplay ? (
                selectedLabels.map((label) => (
                  <Badge key={label} variant="secondary" className="text-xs">
                    {label}
                  </Badge>
                ))
              ) : (
                <Badge variant="secondary" className="text-xs">
                  {value.length} selected
                </Badge>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={searchPlaceholder || `Search ${label.toLowerCase()}...`}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandEmpty>{emptyText || `No ${label.toLowerCase()} found.`}</CommandEmpty>
            <ScrollArea className="max-h-64">
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    onSelect={() => toggleOption(option.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        value.includes(option.value) ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </ScrollArea>
          </Command>
        </PopoverContent>
      </Popover>
      
      {value.length > maxDisplay && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selectedLabels.map((label) => (
            <Badge
              key={label}
              variant="secondary"
              className="text-xs cursor-pointer"
              onClick={() => {
                const optionValue = options.find((opt) => opt.label === label)?.value;
                if (optionValue) toggleOption(optionValue);
              }}
            >
              {label}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
