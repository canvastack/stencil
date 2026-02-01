import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Save } from 'lucide-react';

interface ManualRateFormProps {
  currentRate: number | null;
  onUpdate: (rate: number) => Promise<void>;
  loading?: boolean;
}

export function ManualRateForm({ currentRate, onUpdate, loading = false }: ManualRateFormProps) {
  const [rate, setRate] = useState(currentRate?.toString() || '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const numericRate = parseFloat(rate);
    
    // Validation
    if (isNaN(numericRate) || numericRate <= 0) {
      setError('Please enter a valid positive number');
      return;
    }

    if (numericRate < 1000) {
      setError('Exchange rate seems too low. Please verify the rate.');
      return;
    }

    if (numericRate > 50000) {
      setError('Exchange rate seems too high. Please verify the rate.');
      return;
    }

    try {
      setSaving(true);
      await onUpdate(numericRate);
    } catch (error) {
      setError('Failed to update exchange rate');
    } finally {
      setSaving(false);
    }
  };

  const formatRate = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return cleaned;
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRate(e.target.value);
    setRate(formatted);
    setError(null);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/50">
      <div>
        <h3 className="font-medium">Manual Exchange Rate</h3>
        <p className="text-sm text-muted-foreground">
          Set a fixed USD to IDR exchange rate
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="manual-rate">Exchange Rate (USD to IDR)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              IDR
            </span>
            <Input
              id="manual-rate"
              type="text"
              value={rate}
              onChange={handleRateChange}
              placeholder="15000"
              className="pl-12"
              disabled={loading || saving}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Current rate: {currentRate ? `IDR ${currentRate.toLocaleString()}` : 'Not set'}
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-2">
          <Button 
            type="submit" 
            disabled={loading || saving || !rate}
            size="sm"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Update Rate
              </>
            )}
          </Button>
          
          {rate && parseFloat(rate) > 0 && (
            <div className="text-sm text-muted-foreground">
              $1 USD = IDR {parseFloat(rate).toLocaleString()}
            </div>
          )}
        </div>
      </form>

      <div className="text-xs text-muted-foreground space-y-1">
        <p>• Rate should be between IDR 1,000 - 50,000 per USD</p>
        <p>• This rate will be used for all currency conversions</p>
        <p>• You can update this rate anytime</p>
      </div>
    </div>
  );
}