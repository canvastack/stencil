import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { approvalApi } from '@/services/api/customerQuoteApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

export default function ApprovalSettingsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['approval-settings'],
    queryFn: async () => {
      const response = await approvalApi.getSettings();
      return response.data;
    },
  });

  const { register, handleSubmit, watch, setValue } = useForm({
    values: settings || {},
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => approvalApi.updateSettings(data),
    onSuccess: () => {
      toast({ title: 'Success', description: 'Settings updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['approval-settings'] });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update settings', variant: 'destructive' });
    },
  });

  const onSubmit = (data: any) => {
    updateMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="p-8 text-center">
          <p>Loading...</p>
        </Card>
      </div>
    );
  }

  const autoApprovalEnabled = watch('auto_approval_enabled');

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Approval Settings</h1>
        <p className="text-muted-foreground">Configure customer quote approval rules</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Auto-Approval System</CardTitle>
            <CardDescription>
              Automatically approve low-risk quotes that meet your criteria
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="auto_approval_enabled">Enable Auto-Approval</Label>
              <Switch
                id="auto_approval_enabled"
                checked={autoApprovalEnabled}
                onCheckedChange={(checked) => setValue('auto_approval_enabled', checked)}
              />
            </div>

            {autoApprovalEnabled && (
              <>
                <div>
                  <Label htmlFor="auto_approval_threshold">Auto-Approval Threshold (IDR)</Label>
                  <Input
                    id="auto_approval_threshold"
                    type="number"
                    {...register('auto_approval_threshold', { valueAsNumber: true })}
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Quotes above this amount require manual approval
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {autoApprovalEnabled && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Customer Trust Requirements</CardTitle>
                <CardDescription>
                  Minimum customer trust level for auto-approval
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="require_email_verification">Require Email Verification</Label>
                  <Switch
                    id="require_email_verification"
                    checked={watch('require_email_verification')}
                    onCheckedChange={(checked) => setValue('require_email_verification', checked)}
                  />
                </div>

                <div>
                  <Label htmlFor="min_successful_orders">Minimum Successful Orders</Label>
                  <Input
                    id="min_successful_orders"
                    type="number"
                    {...register('min_successful_orders', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <Label htmlFor="min_payment_success_rate">Minimum Payment Success Rate (%)</Label>
                  <Input
                    id="min_payment_success_rate"
                    type="number"
                    step="0.01"
                    {...register('min_payment_success_rate', { valueAsNumber: true })}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Product Type Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="auto_approve_standard_products">Auto-Approve Standard Products</Label>
                  <Switch
                    id="auto_approve_standard_products"
                    checked={watch('auto_approve_standard_products')}
                    onCheckedChange={(checked) => setValue('auto_approve_standard_products', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="require_approval_custom_products">Require Approval for Custom Products</Label>
                  <Switch
                    id="require_approval_custom_products"
                    checked={watch('require_approval_custom_products')}
                    onCheckedChange={(checked) => setValue('require_approval_custom_products', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Negotiation Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="max_negotiation_rounds">Maximum Negotiation Rounds</Label>
                  <Input
                    id="max_negotiation_rounds"
                    type="number"
                    min="1"
                    max="10"
                    {...register('max_negotiation_rounds', { valueAsNumber: true })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="allow_customer_counter_offer">Allow Customer Counter Offers</Label>
                  <Switch
                    id="allow_customer_counter_offer"
                    checked={watch('allow_customer_counter_offer')}
                    onCheckedChange={(checked) => setValue('allow_customer_counter_offer', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_admin_on_auto_approve">Notify on Auto-Approval</Label>
                  <Switch
                    id="notify_admin_on_auto_approve"
                    checked={watch('notify_admin_on_auto_approve')}
                    onCheckedChange={(checked) => setValue('notify_admin_on_auto_approve', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="notify_admin_on_pending_approval">Notify on Pending Approval</Label>
                  <Switch
                    id="notify_admin_on_pending_approval"
                    checked={watch('notify_admin_on_pending_approval')}
                    onCheckedChange={(checked) => setValue('notify_admin_on_pending_approval', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={updateMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </form>
    </div>
  );
}
