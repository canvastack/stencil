import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  Building,
  User,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { pluginApprovalService } from '@/services/platform/pluginApprovalService';
import { InstalledPlugin } from '@/types/plugin';
import { format, addDays } from 'date-fns';

export default function RequestDetails() {
  const { uuid } = useParams<{ uuid: string }>();
  const navigate = useNavigate();
  const [plugin, setPlugin] = useState<InstalledPlugin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [approveDialog, setApproveDialog] = useState(false);
  const [rejectDialog, setRejectDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPluginDetails = async () => {
    if (!uuid) return;

    setIsLoading(true);
    try {
      const data = await pluginApprovalService.getPluginRequestDetails(uuid);
      setPlugin(data);
      setExpiryDate(format(addDays(new Date(), 365), 'yyyy-MM-dd'));
    } catch (error: any) {
      toast.error('Failed to load plugin details', {
        description: error.message || 'Unable to fetch plugin information',
      });
      navigate('/platform/plugins/requests');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPluginDetails();
  }, [uuid]);

  const handleApprove = async () => {
    if (!plugin) return;

    setIsProcessing(true);
    try {
      await pluginApprovalService.approveRequest(plugin.uuid, {
        approval_notes: approvalNotes || undefined,
        expires_at: expiryDate || undefined,
      });
      toast.success('Plugin request approved', {
        description: 'The plugin will be installed automatically',
      });
      navigate('/platform/plugins/requests');
    } catch (error: any) {
      toast.error('Approval failed', {
        description: error.message || 'Unable to approve plugin request',
      });
    } finally {
      setIsProcessing(false);
      setApproveDialog(false);
    }
  };

  const handleReject = async () => {
    if (!plugin) return;

    if (!rejectionReason.trim()) {
      toast.error('Rejection reason required');
      return;
    }

    setIsProcessing(true);
    try {
      await pluginApprovalService.rejectRequest(plugin.uuid, {
        rejection_reason: rejectionReason,
      });
      toast.success('Plugin request rejected');
      navigate('/platform/plugins/requests');
    } catch (error: any) {
      toast.error('Rejection failed', {
        description: error.message || 'Unable to reject plugin request',
      });
    } finally {
      setIsProcessing(false);
      setRejectDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!plugin) {
    return null;
  }

  const isPending = plugin.status === 'pending';
  const getTenantName = () => {
    if (typeof plugin.requested_by === 'object' && plugin.requested_by) {
      return plugin.requested_by.name || 'Unknown';
    }
    return 'Unknown';
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/platform/plugins/requests')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Plugin Request Details
          </h1>
          <p className="text-muted-foreground mt-1">Review and manage plugin installation request</p>
        </div>
        {isPending && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialog(true)}
              className="text-destructive hover:bg-destructive/10"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject
            </Button>
            <Button
              onClick={() => setApproveDialog(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-800 hover:opacity-90"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Approve
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Plugin Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Plugin Name</Label>
                  <div className="mt-1 font-medium">{plugin.display_name}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Version</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">{plugin.version}</Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <div className="mt-1">
                    <Badge
                      variant={
                        plugin.status === 'pending'
                          ? 'secondary'
                          : plugin.status === 'approved' || plugin.status === 'active'
                          ? 'default'
                          : 'destructive'
                      }
                    >
                      {plugin.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Internal Plugin Name
                  </Label>
                  <div className="mt-1 text-sm font-mono">{plugin.plugin_name}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {plugin.requested_at && (
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">Request Submitted</div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(plugin.requested_at), 'PPPp')}
                    </div>
                    <div className="text-sm text-muted-foreground">by {getTenantName()}</div>
                  </div>
                </div>
              )}

              {plugin.approved_at && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Request Approved</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(plugin.approved_at), 'PPPp')}
                      </div>
                      {plugin.approval_notes && (
                        <div className="text-sm text-muted-foreground mt-1 p-2 bg-muted rounded">
                          {plugin.approval_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {plugin.installed_at && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <Package className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium">Plugin Installed</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(plugin.installed_at), 'PPPp')}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {plugin.rejected_at && (
                <>
                  <Separator />
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-destructive mt-0.5" />
                    <div>
                      <div className="font-medium">Request Rejected</div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(plugin.rejected_at), 'PPPp')}
                      </div>
                      {plugin.rejection_reason && (
                        <div className="text-sm text-destructive mt-1 p-2 bg-destructive/10 rounded">
                          {plugin.rejection_reason}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tenant Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Tenant</Label>
                <div className="mt-1 text-sm">Tenant #{plugin.uuid.substring(0, 8)}</div>
              </div>
              <Separator />
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Requested By</Label>
                <div className="mt-1 text-sm">{getTenantName()}</div>
              </div>
            </CardContent>
          </Card>

          {plugin.expires_at && (
            <Card>
              <CardHeader>
                <CardTitle>License Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Expires At</Label>
                  <div className="mt-1 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    {format(new Date(plugin.expires_at), 'PPP')}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Dialog open={approveDialog} onOpenChange={setApproveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Plugin Request</DialogTitle>
            <DialogDescription>
              Approve installation of "{plugin.display_name}" for this tenant
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="approval-notes">Approval Notes (Optional)</Label>
              <Textarea
                id="approval-notes"
                placeholder="Add any notes about this approval..."
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="expiry-date">License Expiry Date (Optional)</Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Leave empty for unlimited license
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Approving...' : 'Approve & Install'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Plugin Request</DialogTitle>
            <DialogDescription>
              Reject installation of "{plugin.display_name}" for this tenant
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="rejection-reason">Rejection Reason *</Label>
            <Textarea
              id="rejection-reason"
              placeholder="Explain why this request is being rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              required
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason.trim()}
            >
              {isProcessing ? 'Rejecting...' : 'Reject Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
