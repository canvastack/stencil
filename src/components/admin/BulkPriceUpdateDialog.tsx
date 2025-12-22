import { useState, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, Percent, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { bulkOperationsService } from '@/services/api/bulkOperations';
import { formatPrice } from '@/lib/utils/formatters';
import type { 
  BulkOperationConfig,
  BulkPriceUpdate,
  PriceAdjustmentType,
  PriceAdjustmentOperation,
} from '@/types/bulkOperations';
import { cn } from '@/lib/utils';

interface BulkPriceUpdateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
  onSuccess?: (jobId: string) => void;
}

export const BulkPriceUpdateDialog: React.FC<BulkPriceUpdateDialogProps> = ({
  open,
  onOpenChange,
  productIds,
  onSuccess,
}) => {
  const [adjustmentType, setAdjustmentType] = useState<PriceAdjustmentType>('percentage');
  const [operation, setOperation] = useState<PriceAdjustmentOperation>('increase');
  const [value, setValue] = useState('');
  const [dryRun, setDryRun] = useState(false);

  const bulkMutation = useMutation({
    mutationFn: async (config: BulkOperationConfig) => {
      return await bulkOperationsService.createBulkOperation(config);
    },
    onSuccess: (job) => {
      toast.success('Bulk price update started', {
        description: `Processing ${productIds.length} products...`,
      });
      onSuccess?.(job.id);
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error('Failed to start bulk price update', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleSubmit = () => {
    const numValue = parseFloat(value);
    
    if (!value || isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid value');
      return;
    }

    if (adjustmentType === 'percentage' && numValue > 100) {
      toast.error('Percentage cannot exceed 100%');
      return;
    }

    const data: BulkPriceUpdate = {
      adjustmentType,
      operation,
      value: numValue,
    };

    const config: BulkOperationConfig = {
      action: 'update_price',
      productIds,
      data,
      dryRun,
    };

    bulkMutation.mutate(config);
  };

  const exampleCalculation = useMemo(() => {
    const numValue = parseFloat(value);
    if (!value || isNaN(numValue)) return null;

    const samplePrice = 100000;
    let newPrice = samplePrice;

    if (adjustmentType === 'percentage') {
      const multiplier = numValue / 100;
      if (operation === 'increase') {
        newPrice = samplePrice * (1 + multiplier);
      } else if (operation === 'decrease') {
        newPrice = samplePrice * (1 - multiplier);
      } else {
        newPrice = samplePrice;
      }
    } else {
      if (operation === 'increase') {
        newPrice = samplePrice + numValue;
      } else if (operation === 'decrease') {
        newPrice = samplePrice - numValue;
      } else {
        newPrice = numValue;
      }
    }

    return {
      original: samplePrice,
      new: Math.max(0, newPrice),
      difference: newPrice - samplePrice,
    };
  }, [adjustmentType, operation, value]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Bulk Price Update
          </DialogTitle>
          <DialogDescription>
            Adjust prices for {productIds.length} selected products.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label>Adjustment Type</Label>
            <RadioGroup
              value={adjustmentType}
              onValueChange={(v) => setAdjustmentType(v as PriceAdjustmentType)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="percentage" id="percentage" />
                <Label htmlFor="percentage" className="cursor-pointer flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Percentage
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fixed" id="fixed" />
                <Label htmlFor="fixed" className="cursor-pointer flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Fixed Amount (IDR)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-3">
            <Label>Operation</Label>
            <RadioGroup
              value={operation}
              onValueChange={(v) => setOperation(v as PriceAdjustmentOperation)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="increase" id="increase" />
                <Label htmlFor="increase" className="cursor-pointer">
                  Increase prices
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="decrease" id="decrease" />
                <Label htmlFor="decrease" className="cursor-pointer">
                  Decrease prices
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="set" id="set" />
                <Label htmlFor="set" className="cursor-pointer">
                  Set to specific value
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="value">
              {adjustmentType === 'percentage' ? 'Percentage' : 'Amount (IDR)'}
            </Label>
            <div className="relative">
              <Input
                id="value"
                type="number"
                min="0"
                max={adjustmentType === 'percentage' ? '100' : undefined}
                step={adjustmentType === 'percentage' ? '0.1' : '1000'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={adjustmentType === 'percentage' ? 'e.g., 10' : 'e.g., 10000'}
                className="pr-12"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                {adjustmentType === 'percentage' ? '%' : 'IDR'}
              </div>
            </div>
            {adjustmentType === 'percentage' && (
              <p className="text-xs text-muted-foreground">
                Enter a value between 0 and 100
              </p>
            )}
          </div>

          {exampleCalculation && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="text-sm space-y-1">
                  <div className="font-medium">Example calculation:</div>
                  <div className="flex justify-between">
                    <span>Original price:</span>
                    <span>{formatPrice(exampleCalculation.original, 'IDR')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New price:</span>
                    <span className="font-medium">
                      {formatPrice(exampleCalculation.new, 'IDR')}
                    </span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Change:</span>
                    <span className={cn(
                      exampleCalculation.difference > 0 ? 'text-green-600' : 'text-red-600'
                    )}>
                      {exampleCalculation.difference > 0 ? '+' : ''}
                      {formatPrice(exampleCalculation.difference, 'IDR')}
                    </span>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Separator />

          <div className="flex items-center space-x-2">
            <Checkbox
              id="dry-run"
              checked={dryRun}
              onCheckedChange={(checked) => setDryRun(!!checked)}
            />
            <Label htmlFor="dry-run" className="cursor-pointer text-sm">
              Dry run (preview changes without applying)
            </Label>
          </div>

          {dryRun && (
            <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                Dry run mode: Changes will be validated but not saved. Review the results before applying.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={bulkMutation.isPending || !value}>
            {bulkMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {dryRun ? 'Preview Changes' : 'Update Prices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
