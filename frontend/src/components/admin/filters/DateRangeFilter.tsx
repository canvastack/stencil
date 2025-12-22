import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  label: string;
  value?: DateRange;
  onChange: (range?: DateRange) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const DateRangeFilter = ({
  label,
  value,
  onChange,
  placeholder = 'Select date range',
  disabled = false,
  className,
}: DateRangeFilterProps) => {
  const [open, setOpen] = useState(false);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={`date-range-${label}`}>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={`date-range-${label}`}
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground',
              disabled && 'opacity-50 cursor-not-allowed'
            )}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'dd MMM yyyy')} - {format(value.to, 'dd MMM yyyy')}
                </>
              ) : (
                format(value.from, 'dd MMM yyyy')
              )
            ) : (
              <span>{placeholder}</span>
            )}
            {value?.from && (
              <X
                className="ml-auto h-4 w-4 hover:text-destructive"
                onClick={handleClear}
              />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={(range) => {
              onChange(range);
              if (range?.from && range?.to) {
                setOpen(false);
              }
            }}
            numberOfMonths={2}
            disabled={disabled}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
