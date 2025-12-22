import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Loader2,
  Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { approvalService } from '@/services/api/approval';
import type { ApprovalRequest, Approval } from '@/types/approval';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface ProductApprovalPanelProps {
  productId?: string;
  showMyApprovals?: boolean;
}

const ApprovalStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const variants: Record<string, { icon: React.ReactNode; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { 
      icon: <Clock className="h-3 w-3" />, 
      variant: 'outline' 
    },
    approved: { 
      icon: <CheckCircle className="h-3 w-3" />, 
      variant: 'default' 
    },
    rejected: { 
      icon: <XCircle className="h-3 w-3" />, 
      variant: 'destructive' 
    },
    cancelled: { 
      icon: <AlertCircle className="h-3 w-3" />, 
      variant: 'secondary' 
    },
  };

  const config = variants[status] || variants.pending;

  return (
    <Badge variant={config.variant} className="gap-1">
      {config.icon}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
};

const PriorityBadge: React.FC<{ priority: string }> = ({ priority }) => {
  const colors: Record<string, string> = {
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    normal: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  };

  return (
    <Badge className={colors[priority] || colors.normal}>
      {priority.toUpperCase()}
    </Badge>
  );
};

const ApprovalItem: React.FC<{ 
  request: ApprovalRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onCancel: (requestId: string) => void;
  showActions?: boolean;
}> = ({ request, onApprove, onReject, onCancel, showActions = true }) => {
  const [expanded, setExpanded] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const approvedCount = request.approvals.filter(a => a.status === 'approved').length;
  const rejectedCount = request.approvals.filter(a => a.status === 'rejected').length;
  const pendingCount = request.approvals.filter(a => a.status === 'pending').length;

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex gap-3 flex-1">
          <Avatar className="h-10 w-10">
            <AvatarImage src={request.requestedByAvatar} />
            <AvatarFallback>{getInitials(request.requestedByName)}</AvatarFallback>
          </Avatar>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium">{request.requestedByName}</span>
              <span className="text-sm text-muted-foreground">requested</span>
              <Badge variant="outline">{request.requestType}</Badge>
              <span className="text-sm text-muted-foreground">for</span>
              <span className="font-medium text-sm">{request.productName}</span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ApprovalStatusBadge status={request.status} />
              <PriorityBadge priority={request.priority} />
              <Badge variant="secondary" className="gap-1">
                {approvedCount}/{request.requiredApprovals} approved
              </Badge>
              {pendingCount > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {pendingCount} pending
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true })}</span>
              {request.deadline && (
                <span>Deadline: {format(new Date(request.deadline), 'PPp')}</span>
              )}
            </div>

            {request.notes && (
              <p className="text-sm text-muted-foreground bg-secondary/20 rounded p-2">
                {request.notes}
              </p>
            )}

            {expanded && request.approvals.length > 0 && (
              <div className="space-y-2 mt-3">
                <p className="text-sm font-medium">Approvals:</p>
                {request.approvals.map((approval) => (
                  <div key={approval.id} className="flex items-start gap-2 p-2 bg-secondary/10 rounded">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={approval.approverAvatar} />
                      <AvatarFallback className="text-xs">
                        {getInitials(approval.approverName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{approval.approverName}</span>
                        <ApprovalStatusBadge status={approval.status} />
                      </div>
                      {approval.comments && (
                        <p className="text-muted-foreground mt-1">{approval.comments}</p>
                      )}
                      {approval.approvedAt && (
                        <p className="text-muted-foreground mt-1">
                          {format(new Date(approval.approvedAt), 'PPp')}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="gap-1 text-xs"
        >
          <MessageSquare className="h-3 w-3" />
          {expanded ? 'Hide' : 'Show'} Details
        </Button>

        {showActions && request.status === 'pending' && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onApprove(request.id)}
              className="gap-2"
            >
              <ThumbsUp className="h-4 w-4" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReject(request.id)}
              className="gap-2 text-destructive hover:text-destructive"
            >
              <ThumbsDown className="h-4 w-4" />
              Reject
            </Button>
            {request.requestedBy === 'current-user-id' && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onCancel(request.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export const ProductApprovalPanel: React.FC<ProductApprovalPanelProps> = ({ 
  productId,
  showMyApprovals = false 
}) => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [comments, setComments] = useState('');

  const { data: requestsData, isLoading } = useQuery({
    queryKey: showMyApprovals 
      ? ['my-approvals', activeTab, filterPriority]
      : ['approval-requests', productId, activeTab, filterPriority],
    queryFn: () => showMyApprovals
      ? approvalService.getMyApprovals(1, 50)
      : approvalService.getApprovalRequests(1, 50, {
          status: activeTab !== 'all' ? [activeTab] : undefined,
          priority: filterPriority !== 'all' ? [filterPriority] : undefined,
        }),
  });

  const { data: stats } = useQuery({
    queryKey: ['approval-stats'],
    queryFn: () => approvalService.getStats(),
  });

  const approveMutation = useMutation({
    mutationFn: (data: { requestId: string; comments?: string }) =>
      approvalService.approveRequest(data.requestId, data.comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      toast.success('Request approved');
      setApproveDialogOpen(false);
      setSelectedRequestId(null);
      setComments('');
    },
    onError: (error: any) => {
      toast.error('Failed to approve request', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: (data: { requestId: string; comments?: string }) =>
      approvalService.rejectRequest(data.requestId, data.comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      toast.success('Request rejected');
      setRejectDialogOpen(false);
      setSelectedRequestId(null);
      setComments('');
    },
    onError: (error: any) => {
      toast.error('Failed to reject request', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (requestId: string) => approvalService.cancelRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approval-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['approval-stats'] });
      toast.success('Request cancelled');
    },
    onError: (error: any) => {
      toast.error('Failed to cancel request', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleApprove = (requestId: string) => {
    setSelectedRequestId(requestId);
    setApproveDialogOpen(true);
  };

  const handleReject = (requestId: string) => {
    setSelectedRequestId(requestId);
    setRejectDialogOpen(true);
  };

  const handleConfirmApprove = () => {
    if (selectedRequestId) {
      approveMutation.mutate({ requestId: selectedRequestId, comments });
    }
  };

  const handleConfirmReject = () => {
    if (selectedRequestId) {
      rejectMutation.mutate({ requestId: selectedRequestId, comments });
    }
  };

  const handleCancel = (requestId: string) => {
    cancelMutation.mutate(requestId);
  };

  const filteredRequests = requestsData?.requests || [];

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">
                {showMyApprovals ? 'My Approvals' : 'Approval Requests'}
              </h3>
            </div>
            {stats && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {stats.totalRequests} total
                </Badge>
                {stats.pendingRequests > 0 && (
                  <Badge variant="destructive">
                    {stats.pendingRequests} pending
                  </Badge>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  Pending
                  {stats && stats.pendingRequests > 0 && (
                    <span className="text-xs">({stats.pendingRequests})</span>
                  )}
                </TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="rejected">Rejected</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No approval requests</p>
              <p className="text-sm mt-1">
                {activeTab === 'pending' 
                  ? 'All caught up! No pending approvals.' 
                  : 'No requests found for this filter.'}
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-3">
                {filteredRequests.map((request) => (
                  <ApprovalItem
                    key={request.id}
                    request={request}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onCancel={handleCancel}
                    showActions={showMyApprovals}
                  />
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </Card>

      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Request</DialogTitle>
            <DialogDescription>
              Add optional comments for this approval
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Add comments (optional)..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmApprove} disabled={approveMutation.isPending}>
              {approveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Request</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Reason for rejection..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmReject} 
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
