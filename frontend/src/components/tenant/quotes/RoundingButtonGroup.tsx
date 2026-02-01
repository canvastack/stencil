/**
 * Rounding Button Group Component
 * 
 * Provides buttons for price rounding options:
 * - Round Up (ceiling)
 * - Round Down (floor)
 * - Reset to Original (default)
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowUp, ArrowDown, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type RoundingMode = 'up' | 'down' | 'none';

interface RoundingButtonGroupProps {
  value: number;
  onChange: (value: number, mode: RoundingMode) => void;
  activeMode?: RoundingMode;
  className?: string;
}

export const RoundingButtonGroup: React.FC<RoundingButtonGroupProps> = ({
  value,
  onChange,
  activeMode = 'none',
  className
}) => {
  // Store original value when component mounts or value changes from parent
  const [originalValue, setOriginalValue] = useState(value);
  
  // Update original value when value changes and mode is 'none'
  useEffect(() => {
    if (activeMode === 'none') {
      setOriginalValue(value);
    }
  }, [value, activeMode]);

  const handleRounding = (mode: RoundingMode) => {
    let roundedValue = value;
    
    switch (mode) {
      case 'up':
        // Round up to nearest thousand
        roundedValue = Math.ceil(value / 1000) * 1000;
        break;
      case 'down':
        // Round down to nearest thousand
        roundedValue = Math.floor(value / 1000) * 1000;
        break;
      case 'none':
        // Reset to original value
        roundedValue = originalValue;
        break;
    }
    
    onChange(roundedValue, mode);
  };

  const roundedUp = Math.ceil(value / 1000) * 1000;
  const roundedDown = Math.floor(value / 1000) * 1000;

  return (
    <TooltipProvider>
      <div className={cn("flex items-center gap-1", className)}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={activeMode === 'up' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRounding('up')}
              disabled={activeMode === 'down'}
              className="h-8 w-8 p-0"
            >
              <ArrowUp className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pembulatan ke atas: Rp {roundedUp.toLocaleString('id-ID')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={activeMode === 'none' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRounding('none')}
              disabled={activeMode === 'none'}
              className="h-8 w-8 p-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset ke nilai asli: Rp {originalValue.toLocaleString('id-ID')}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant={activeMode === 'down' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleRounding('down')}
              disabled={activeMode === 'up'}
              className="h-8 w-8 p-0"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Pembulatan ke bawah: Rp {roundedDown.toLocaleString('id-ID')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
