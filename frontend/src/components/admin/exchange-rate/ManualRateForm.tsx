import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Save, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { exchangeRateService } from '@/services/api/exchangeRate';
import { ExchangeRateSetting } from '@/types/exchangeRate';

interface ManualRateFormProps {
  settings: ExchangeRateSetting;
  onUpdate: (settings: ExchangeRateSetting) => void;
}

export default function ManualRateForm({ settings, onUpdate }: ManualRateFormProps) {
  const [manualRate, setManualRate] = useState<string>(
    settings.manual_rate?.toString() || ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>('');

  const validateRate = (value: string): boolean => {
    setError('');

    if (!value.trim()) {
      setError('Exchange rate is required');
      return false;
    }

    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      setError('Please enter a valid number');
      return false;
    }

    if (numValue <= 0) {
      setError('Exchange rate must be greater than 0');
      return false;
    }

    // Reasonable range for USD to IDR (10,000 - 20,000)
    if (numValue < 10000 || numValue > 20000) {
      setError('Exchange rate should be between 10,000 and 20,000 for USD to IDR');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateRate(manualRate)) {
      return;
    }

    try {
      setSaving(true);
      const updatedSettings = await exchangeRateService.updateSettings({
        mode: 'manual',
        manual_rate: parseFloat(manualRate),
        auto_update_enabled: settings.auto_update_enabled,
        update_time: settings.update_time,
      });
      onUpdate(updatedSettings);
      toast.success('Manual exchange rate saved successfully');
    } catch (error: any) {
      console.error('Failed to save manual rate:', error);
      const errorMessage = error?.errors?.manual_rate?.[0] || 'Failed to save exchange rate';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (value: string) => {
    setManualRate(value);
    setError('');
  };

  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
              Manual Rate Entry
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              You are responsible for keeping the exchange rate up to date. The rate will be
              used for all currency conversions until you update it again.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="manualRate">
          Exchange Rate (1 USD = ? IDR) <span className="text-destructive">*</span>
        </Label>
        <Input
          id="manualRate"
          type="number"
          step="0.01"
          placeholder="15000.00"
          value={manualRate}
          onChange={(e) => handleInputChange(e.target.value)}
          className={error ? 'border-destructive' : ''}
        />
        {error && (
          <p className="text-sm text-destructive flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {error}
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter the current exchange rate from USD to IDR. Example: 15000 means 1 USD = 15,000 IDR
        </p>
      </div>

      {settings.last_updated_at && (
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date(settings.last_updated_at).toLocaleString()}
        </div>
      )}

      <Button onClick={handleSave} disabled={saving || !manualRate.trim()}>
        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        <Save className="mr-2 h-4 w-4" />
        {saving ? 'Saving...' : 'Save Exchange Rate'}
      </Button>
    </div>
  );
}
