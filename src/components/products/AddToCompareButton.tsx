import React from 'react';
import { GitCompare, Check } from 'lucide-react';
import { useProductComparison } from '@/contexts/ProductComparisonContext';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { Product } from '@/types/product';

interface AddToCompareButtonProps {
  product: Product;
  variant?: 'default' | 'ghost' | 'outline' | 'icon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

export const AddToCompareButton: React.FC<AddToCompareButtonProps> = ({
  product,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  className,
}) => {
  const { isComparing, addToCompare, removeFromCompare, isMaxReached } = useProductComparison();
  const isInComparison = isComparing(product.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isInComparison) {
      removeFromCompare(product.id);
    } else {
      addToCompare(product);
    }
  };

  const tooltipContent = isInComparison
    ? 'Remove from comparison'
    : isMaxReached
    ? 'Maximum products reached'
    : 'Add to comparison';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isInComparison ? 'default' : variant}
            size={size}
            onClick={handleClick}
            disabled={!isInComparison && isMaxReached}
            className={className}
          >
            {isInComparison ? (
              <Check className="h-4 w-4" />
            ) : (
              <GitCompare className="h-4 w-4" />
            )}
            {showLabel && (
              <span className="ml-2">
                {isInComparison ? 'Comparing' : 'Compare'}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipContent}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
