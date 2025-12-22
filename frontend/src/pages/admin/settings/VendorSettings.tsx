import { useState, useEffect } from 'react';
import { LazyWrapper } from '@/components/ui/lazy-wrapper';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Separator,
} from '@/components/ui/lazy-components';
import { toast } from '@/lib/toast-config';
import { tenantApiClient } from '@/services/api/tenantApiClient';
import { Loader2, Save, RotateCcw, Settings2, Building2, Star, DollarSign, Clock } from 'lucide-react';

interface VendorSettingsData {
  company_size_large_threshold: number;
  company_size_medium_threshold: number;
  min_rating_for_auto_approval: number;
  default_payment_terms: number;
  max_lead_time_days: number;
}

export default function VendorSettings() {
  const [settings, setSettings] = useState<VendorSettingsData>({
    company_size_large_threshold: 100,
    company_size_medium_threshold: 20,
    min_rating_for_auto_approval: 4.5,
    default_payment_terms: 30,
    max_lead_time_days: 60,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const response = await tenantApiClient.get<VendorSettingsData>('/settings/vendor');
      setSettings(response.data);
    } catch (error) {
      toast.error('Failed to load vendor settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      await tenantApiClient.put('/settings/vendor', settings);
      toast.success('Vendor settings saved successfully');
    } catch (error) {
      toast.error('Failed to save vendor settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setSettings({
      company_size_large_threshold: 100,
      company_size_medium_threshold: 20,
      min_rating_for_auto_approval: 4.5,
      default_payment_terms: 30,
      max_lead_time_days: 60,
    });
    toast.info('Settings reset to defaults');
  };

  const updateSetting = (key: keyof VendorSettingsData, value: number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  if (isLoading) {
    return (
      <LazyWrapper>
        <div className="p-6 flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </LazyWrapper>
    );
  }

  return (
    <LazyWrapper>
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Vendor Configuration</h1>
          <p className="text-muted-foreground">
            Configure business rules and thresholds for vendor management
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Large Threshold</p>
                <p className="text-xl font-bold">{settings.company_size_large_threshold}</p>
                <p className="text-xs text-muted-foreground">orders</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <Star className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Min Rating</p>
                <p className="text-xl font-bold">{settings.min_rating_for_auto_approval}</p>
                <p className="text-xs text-muted-foreground">stars</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <DollarSign className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Payment Terms</p>
                <p className="text-xl font-bold">{settings.default_payment_terms}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Clock className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Max Lead Time</p>
                <p className="text-xl font-bold">{settings.max_lead_time_days}</p>
                <p className="text-xs text-muted-foreground">days</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>Business Rules Configuration</CardTitle>
          <CardDescription>
            Adjust these settings to control vendor classification and approval processes.
            Changes will take effect immediately for new vendor operations.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Company Size Classification</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="large_threshold">Large Vendor Threshold (Orders)</Label>
                <Input
                  id="large_threshold"
                  type="number"
                  min="1"
                  value={settings.company_size_large_threshold}
                  onChange={(e) => updateSetting('company_size_large_threshold', parseInt(e.target.value) || 0)}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Vendors with total orders ≥ this value are classified as "Large"
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="medium_threshold">Medium Vendor Threshold (Orders)</Label>
                <Input
                  id="medium_threshold"
                  type="number"
                  min="1"
                  value={settings.company_size_medium_threshold}
                  onChange={(e) => updateSetting('company_size_medium_threshold', parseInt(e.target.value) || 0)}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Vendors with total orders ≥ this value are classified as "Medium"
                </p>
              </div>
            </div>

            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-2">Classification Preview:</p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>
                  • <span className="font-semibold text-foreground">Small</span>: {'<'} {settings.company_size_medium_threshold} orders
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Medium</span>: {settings.company_size_medium_threshold} - {settings.company_size_large_threshold - 1} orders
                </li>
                <li>
                  • <span className="font-semibold text-foreground">Large</span>: ≥ {settings.company_size_large_threshold} orders
                </li>
              </ul>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Vendor Approval Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="min_rating">Minimum Rating for Auto-Approval</Label>
                <Input
                  id="min_rating"
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  value={settings.min_rating_for_auto_approval}
                  onChange={(e) => updateSetting('min_rating_for_auto_approval', parseFloat(e.target.value) || 0)}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Vendors with rating ≥ this value qualify for automatic approval (0-5 scale)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_terms">Default Payment Terms (Days)</Label>
                <Input
                  id="payment_terms"
                  type="number"
                  min="0"
                  value={settings.default_payment_terms}
                  onChange={(e) => updateSetting('default_payment_terms', parseInt(e.target.value) || 0)}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Default number of days for payment terms with new vendors
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-4">Lead Time Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="max_lead_time">Maximum Lead Time (Days)</Label>
                <Input
                  id="max_lead_time"
                  type="number"
                  min="1"
                  value={settings.max_lead_time_days}
                  onChange={(e) => updateSetting('max_lead_time_days', parseInt(e.target.value) || 0)}
                  className="font-mono"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum acceptable lead time for vendor orders
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleResetSettings}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </LazyWrapper>
  );
}
