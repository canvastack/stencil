import React, { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Input,
} from '@/components/ui/lazy-components';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  MessageSquare,
  ArrowRight,
  AlertCircle,
  Loader2,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  Edit2,
  Send,
} from 'lucide-react';
import { 
  RefundRequest, 
  RefundApproval, 
  RefundStatus, 
  ApprovalDecision 
} from '@/types/refund';
import { useApproveRefund } from '@/hooks/useRefunds';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface RefundApprovalWorkflowProps {
  refund: RefundRequest;
  onStatusChange?: (newStatus: RefundStatus) => void;
  readonly?: boolean;
}

interface ApprovalLevel {
  level: number;
  name: string;
  role: string;
  maxAmount: number;
  required: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approver?: {
    id: string;
    name: string;
    role: string;
  };
  approval?: RefundApproval;
}

export default function RefundApprovalWorkflow({ 
  refund, 
  onStatusChange, 
  readonly = false 
}: RefundApprovalWorkflowProps) {
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<ApprovalLevel | null>(null);
  const [approvalForm, setApprovalForm] = useState({
    decision: ApprovalDecision.Approved,
    decisionNotes: '',
    adjustedAmount: 0,
  });

  const approveRefundMutation = useApproveRefund();

  // Define approval workflow levels based on refund amount and reason
  const getApprovalLevels = (): ApprovalLevel[] => {
    const refundAmount = refund.calculation.refundableToCustomer;
    const baselevels: ApprovalLevel[] = [
      {
        level: 1,
        name: 'Customer Service Review',
        role: 'customer_service',
        maxAmount: 500000,
        required: true,
        status: 'pending',
      },
      {
        level: 2,
        name: 'Finance Approval',
        role: 'finance_manager',
        maxAmount: 2000000,
        required: refundAmount > 500000,
        status: 'pending',
      },
      {
        level: 3,
        name: 'Manager Approval',
        role: 'general_manager',
        maxAmount: Infinity,
        required: refundAmount > 2000000,
        status: 'pending',
      },
    ];

    // Quality issues always need finance approval
    if (refund.refundReason === 'quality_issue') {
      baselevels[1].required = true;
    }

    // Map existing approvals to levels
    refund.approvals?.forEach(approval => {
      const levelIndex = approval.approvalLevel - 1;
      if (baselevels[levelIndex]) {
        baselevels[levelIndex].status = 
          approval.decision === 'approved' ? 'approved' :
          approval.decision === 'rejected' ? 'rejected' : 'pending';
        baselevels[levelIndex].approver = approval.approver;
        baselevels[levelIndex].approval = approval;
      }
    });

    // Determine current status based on workflow
    let allCompleted = true;
    baselevels.forEach((level, index) => {
      if (!level.required) {
        level.status = 'completed';
        return;
      }

      if (level.status === 'rejected') {
        // If rejected, mark all subsequent levels as not needed
        baselevels.slice(index + 1).forEach(subsequentLevel => {
          subsequentLevel.status = 'completed';
        });
        allCompleted = false;
        return;
      }

      if (level.status === 'pending') {
        allCompleted = false;
        // Only first pending level should be available for approval
        if (index > 0 && baselevels[index - 1].status !== 'approved') {
          // Previous level not approved yet
        }
      }
    });

    return baselevels.filter(level => level.required);
  };

  const approvalLevels = getApprovalLevels();
  const currentLevel = approvalLevels.find(level => level.status === 'pending');
  const isWorkflowComplete = approvalLevels.every(level => 
    level.status === 'approved' || level.status === 'rejected' || !level.required
  );
  const isWorkflowApproved = approvalLevels.every(level => 
    !level.required || level.status === 'approved'
  );
  const isWorkflowRejected = approvalLevels.some(level => level.status === 'rejected');

  // Status colors and icons
  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
          icon: <Clock className="h-4 w-4" />,
          label: 'Menunggu',
        };
      case 'approved':
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
          icon: <CheckCircle2 className="h-4 w-4" />,
          label: 'Disetujui',
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
          icon: <XCircle className="h-4 w-4" />,
          label: 'Ditolak',
        };
      case 'completed':
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <CheckCircle2 className="h-4 w-4" />,
          label: 'Selesai',
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
          icon: <Clock className="h-4 w-4" />,
          label: 'Unknown',
        };
    }
  };

  const handleApprove = (level: ApprovalLevel) => {
    if (readonly) return;
    
    setSelectedLevel(level);
    setApprovalForm({
      decision: ApprovalDecision.Approved,
      decisionNotes: '',
      adjustedAmount: refund.calculation.refundableToCustomer,
    });
    setIsApprovalDialogOpen(true);
  };

  const handleReject = (level: ApprovalLevel) => {
    if (readonly) return;
    
    setSelectedLevel(level);
    setApprovalForm({
      decision: ApprovalDecision.Rejected,
      decisionNotes: '',
      adjustedAmount: 0,
    });
    setIsApprovalDialogOpen(true);
  };

  const handleRequestInfo = (level: ApprovalLevel) => {
    if (readonly) return;
    
    setSelectedLevel(level);
    setApprovalForm({
      decision: ApprovalDecision.NeedsInfo,
      decisionNotes: '',
      adjustedAmount: refund.calculation.refundableToCustomer,
    });
    setIsApprovalDialogOpen(true);
  };

  const handleSubmitApproval = async () => {
    if (!selectedLevel) return;

    try {
      await approveRefundMutation.mutateAsync({
        id: refund.id,
        data: approvalForm
      });
      
      setIsApprovalDialogOpen(false);
      setSelectedLevel(null);

      // Determine new status
      let newStatus: RefundStatus = refund.status;
      if (approvalForm.decision === ApprovalDecision.Rejected) {
        newStatus = RefundStatus.Rejected;
      } else if (approvalForm.decision === ApprovalDecision.NeedsInfo) {
        newStatus = RefundStatus.UnderInvestigation;
      } else if (approvalForm.decision === ApprovalDecision.Approved) {
        // Check if this completes the workflow
        if (selectedLevel.level === Math.max(...approvalLevels.map(l => l.level))) {
          newStatus = RefundStatus.Approved;
        } else {
          // Move to next level
          const nextLevel = approvalLevels.find(l => l.level > selectedLevel.level);
          if (nextLevel?.role === 'finance_manager') {
            newStatus = RefundStatus.PendingFinance;
          } else if (nextLevel?.role === 'general_manager') {
            newStatus = RefundStatus.PendingManager;
          }
        }
      }

      onStatusChange?.(newStatus);
    } catch (error) {
      console.error('Approval failed:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Workflow Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Approval Workflow - {refund.requestNumber}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Workflow Status Summary */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                {isWorkflowComplete ? (
                  isWorkflowApproved ? (
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  ) : (
                    <XCircle className="h-6 w-6 text-red-600" />
                  )
                ) : (
                  <Clock className="h-6 w-6 text-yellow-600" />
                )}
                <div>
                  <p className="font-medium">
                    {isWorkflowComplete 
                      ? (isWorkflowApproved ? 'Workflow Completed - Approved' : 'Workflow Completed - Rejected')
                      : `Pending Approval - Level ${currentLevel?.level}`
                    }
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isWorkflowComplete 
                      ? 'All required approvals have been processed'
                      : `Waiting for ${currentLevel?.name}`
                    }
                  </p>
                </div>
              </div>
              
              <div className="ml-auto">
                <Badge 
                  variant="outline" 
                  className={
                    isWorkflowComplete 
                      ? (isWorkflowApproved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800')
                      : 'bg-yellow-100 text-yellow-800'
                  }
                >
                  {isWorkflowComplete 
                    ? (isWorkflowApproved ? 'Approved' : 'Rejected')
                    : 'In Progress'
                  }
                </Badge>
              </div>
            </div>

            {/* Workflow Steps */}
            <div className="space-y-3">
              {approvalLevels.map((level, index) => {
                const statusDisplay = getStatusDisplay(level.status);
                const isActive = currentLevel?.level === level.level;
                const canTakeAction = isActive && !readonly;

                return (
                  <div
                    key={level.level}
                    className={`border rounded-lg p-4 transition-all ${
                      isActive ? 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' : 'border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusDisplay.color}`}>
                          {statusDisplay.icon}
                          {statusDisplay.label}
                        </div>
                        <div>
                          <h4 className="font-medium">{level.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            Level {level.level} • Max Amount: Rp {level.maxAmount === Infinity ? '∞' : level.maxAmount.toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                      
                      {/* Action Buttons */}
                      {canTakeAction && (
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleApprove(level)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRequestInfo(level)}
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Request Info
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(level)}
                            className="text-red-600 border-red-600 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Approval Details */}
                    {level.approval && (
                      <div className="mt-3 p-3 bg-background rounded border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{level.approval.approver?.name}</span>
                            <Badge variant="secondary" className="text-xs">
                              {level.approval.approver?.role}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(level.approval.decidedAt), 'dd/MM/yyyy HH:mm', { locale: id })}
                          </div>
                        </div>
                        
                        {level.approval.decisionNotes && (
                          <div className="mb-2">
                            <p className="text-sm">{level.approval.decisionNotes}</p>
                          </div>
                        )}
                        
                        {level.approval.adjustedAmount && level.approval.adjustedAmount !== refund.calculation.refundableToCustomer && (
                          <div className="flex items-center gap-2 text-sm">
                            <DollarSign className="h-4 w-4" />
                            <span>Adjusted Amount: Rp {level.approval.adjustedAmount.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Progress Indicator */}
                    {index < approvalLevels.length - 1 && (
                      <div className="flex justify-center mt-4">
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Impact Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Financial Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Original Amount</p>
              <p className="text-lg font-bold">
                Rp {refund.calculation.orderTotal.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Customer Refund</p>
              <p className="text-lg font-bold text-green-600">
                Rp {refund.calculation.refundableToCustomer.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Company Loss</p>
              <p className="text-lg font-bold text-red-600">
                Rp {refund.calculation.companyLoss.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Insurance Cover</p>
              <p className="text-lg font-bold text-blue-600">
                Rp {refund.calculation.insuranceCover.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approval Action Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalForm.decision === ApprovalDecision.Approved ? 'Approve Refund Request' :
               approvalForm.decision === ApprovalDecision.Rejected ? 'Reject Refund Request' :
               'Request Additional Information'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedLevel && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{selectedLevel.name}</p>
                <p className="text-sm text-muted-foreground">Level {selectedLevel.level}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="decision">Decision</Label>
              <Select
                value={approvalForm.decision}
                onValueChange={(value: ApprovalDecision) => setApprovalForm({ ...approvalForm, decision: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select decision" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ApprovalDecision.Approved}>Approve</SelectItem>
                  <SelectItem value={ApprovalDecision.Rejected}>Reject</SelectItem>
                  <SelectItem value={ApprovalDecision.NeedsInfo}>Request More Information</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {approvalForm.decision === ApprovalDecision.Approved && (
              <div className="space-y-2">
                <Label htmlFor="adjustedAmount">Adjusted Amount (Rp)</Label>
                <Input
                  id="adjustedAmount"
                  type="number"
                  value={approvalForm.adjustedAmount || ''}
                  onChange={(e) => setApprovalForm({ ...approvalForm, adjustedAmount: Number(e.target.value) })}
                  placeholder="Leave blank to use calculated amount"
                />
                <p className="text-xs text-muted-foreground">
                  Calculated amount: Rp {refund.calculation.refundableToCustomer.toLocaleString('id-ID')}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="decisionNotes">
                {approvalForm.decision === ApprovalDecision.Approved ? 'Approval Notes' :
                 approvalForm.decision === ApprovalDecision.Rejected ? 'Rejection Reason' :
                 'Information Request'}
              </Label>
              <Textarea
                id="decisionNotes"
                placeholder={
                  approvalForm.decision === ApprovalDecision.Approved ? 'Enter approval notes (optional)' :
                  approvalForm.decision === ApprovalDecision.Rejected ? 'Explain why this refund is rejected' :
                  'Specify what additional information is needed'
                }
                rows={3}
                value={approvalForm.decisionNotes}
                onChange={(e) => setApprovalForm({ ...approvalForm, decisionNotes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitApproval}
              disabled={approveRefundMutation.isPending}
              className={
                approvalForm.decision === ApprovalDecision.Approved ? 'bg-green-600 hover:bg-green-700' :
                approvalForm.decision === ApprovalDecision.Rejected ? 'bg-red-600 hover:bg-red-700' :
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              {approveRefundMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Send className="w-4 h-4 mr-2" />
              Submit {
                approvalForm.decision === ApprovalDecision.Approved ? 'Approval' :
                approvalForm.decision === ApprovalDecision.Rejected ? 'Rejection' :
                'Request'
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}