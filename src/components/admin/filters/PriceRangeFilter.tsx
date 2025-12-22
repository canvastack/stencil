import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceRangeFilterProps {
  label?: string;
  min: number;
  max: number;
  value: [number, number];
  onChange: (range: [number, number]) => void;
  currency?: string;
  step?: number;
  disabled?: boolean;
  className?: string;
}

const formatPrice = (price: number, currency: string): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: currency || 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

export const PriceRangeFilter = ({
  label = 'Price Range',
  min,
  max,
  value,
  onChange,
  currency = 'IDR',
  step = 1000,
  disabled = false,
  className,
}: PriceRangeFilterProps) => {
  const [localValue, setLocalValue] = useState<[number, number]>(value);
  const [minInput, setMinInput] = useState<string>(value[0].toString());
  const [maxInput, setMaxInput] = useState<string>(value[1].toString());

  useEffect(() => {
    setLocalValue(value);
    setMinInput(value[0].toString());
    setMaxInput(value[1].toString());
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (
        localValue[0] !== value[0] ||
        localValue[1] !== value[1]
      ) {
        onChange(localValue);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  const handleSliderChange = (newValue: number[]) => {
    const range: [number, number] = [newValue[0], newValue[1]];
    setLocalValue(range);
    setMinInput(range[0].toString());
    setMaxInput(range[1].toString());
  };

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setMinInput(val);
    
    const numVal = parseInt(val) || min;
    if (numVal >= min && numVal <= localValue[1]) {
      setLocalValue([numVal, localValue[1]]);
    }
  };

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setMaxInput(val);
    
    const numVal = parseInt(val) || max;
    if (numVal <= max && numVal >= localValue[0]) {
      setLocalValue([localValue[0], numVal]);
    }
  };

  const handleClear = () => {
    const defaultRange: [number, number] = [min, max];
    setLocalValue(defaultRange);
    setMinInput(min.toString());
    setMaxInput(max.toString());
    onChange(defaultRange);
  };

  const isFiltered = useMemo(() => {
    return localValue[0] !== min || localValue[1] !== max;
  }, [localValue, min, max]);

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor={`price-range-${label}`}>{label}</Label>
        {isFiltered && (
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

      <Slider
        id={`price-range-${label}`}
        min={min}
        max={max}
        step={step}
        value={localValue}
        onValueChange={handleSliderChange}
        disabled={disabled}
        className="w-full"
      />

      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={minInput}
          onChange={handleMinInputChange}
          disabled={disabled}
          className="w-full"
          placeholder="Min"
          aria-label="Minimum price"
        />
        <span className="text-muted-foreground">-</span>
        <Input
          type="text"
          value={maxInput}
          onChange={handleMaxInputChange}
          disabled={disabled}
          className="w-full"
          placeholder="Max"
          aria-label="Maximum price"
        />
      </div>

      <div className="text-sm text-muted-foreground text-center">
        {formatPrice(localValue[0], currency)} - {formatPrice(localValue[1], currency)}
      </div>
    </div>
  );
};
