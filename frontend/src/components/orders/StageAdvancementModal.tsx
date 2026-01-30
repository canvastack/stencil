/**
 * Stage Advancement Modal Component
 * 
 * Dedicated modal for stage advancement workflow with:
 * - Requirements checklist for advancing
 * - Notes field for advancement reason
 * - Confirmation dialog for critical stages
 * - Validation for required fields
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All data from OrderProgressCalculator
 * - ✅ BUSINESS ALIGNMENT: Follows business workflow stages
 * - ✅ VALIDATION: Required field validation before advancement
 * - ✅ CONFIRMATION: Critical stage confirmation dialogs
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertTriangle,
  FileText,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  ChevronRight,
  XCircle
} from 'lucide-react';
import { BusinessStage, OrderProgressCalculator } from '@/utils/OrderProgressCalculator';
import { StatusColorSystem } from '@/utils/StatusColorSystem';
import { OrderStatus } from '@/types/order';
import { toast } from 'sonner';
import { useAdvanceOrderStage } from '@/hooks/useOrders';
import { OrderStatusMessaging } from '@/utils/OrderStatusMessaging';
import { StatusChangeConfirmation } from '@/utils/StatusChangeConfirmation';
import StatusChangeConfirmationDialog from './StatusChangeConfirmationDialog';
import { cn } from '@/lib/utils';

interface StageRequirement {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  required: boolean;
  validationRule?: () => boolean;
}

interface AdvancementValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface StageAdvancementModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStage: BusinessStage | null;
  currentStatus: OrderStatus;
  currentStage: BusinessStage;
  timeline?: any[];
  userPermissions: string[];
  orderId: string; // Add orderId for API calls
}

// Define critical stages that require confirmation
const CRITICAL_STAGES = [
  BusinessStage.IN_PRODUCTION,
  BusinessStage.SHIPPING,
  BusinessStage.DELIVERED,
  BusinessStage.CANCELLED
];

// Define stage-specific requirements
const getStageRequirements = (
  targetStage: BusinessStage, 
  currentStage: BusinessStage,
  progressInfo: any,
  timeline: any[]
): StageRequirement[] => {
  const requirements: StageRequirement[] = [];

  switch (targetStage) {
    case BusinessStage.VENDOR_SOURCING:
      requirements.push({
        id: 'product-specs-defined',
        label: 'Product Specifications Defined',
        description: 'Clear product specifications and requirements have been documented',
        completed: true, // If we can advance here, specs should be defined
        required: true
      });
      break;

    case BusinessStage.CUSTOMER_QUOTE:
      requirements.push({
        id: 'vendor-quote-received',
        label: 'Vendor Quote Received',
        description: 'At least one vendor quote has been received and reviewed',
        completed: progressInfo.completedStages.includes(BusinessStage.VENDOR_SOURCING),
        required: true
      });
      requirements.push({
        id: 'pricing-calculated',
        label: 'Customer Pricing Calculated',
        description: 'Final customer pricing including markup has been calculated',
        completed: false, // This should be checked manually
        required: true
      });
      break;

    case BusinessStage.CUSTOMER_APPROVAL:
      requirements.push({
        id: 'quote-sent',
        label: 'Quote Sent to Customer',
        description: 'Customer quote has been sent and customer has been notified',
        completed: progressInfo.completedStages.includes(BusinessStage.CUSTOMER_QUOTE),
        required: true
      });
      break;

    case BusinessStage.PARTIAL_PAYMENT:
      requirements.push({
        id: 'customer-approved',
        label: 'Customer Approval Received',
        description: 'Customer has approved the quote and agreed to proceed',
        completed: progressInfo.completedStages.includes(BusinessStage.CUSTOMER_APPROVAL),
        required: true
      });
      requirements.push({
        id: 'payment-terms-agreed',
        label: 'Payment Terms Agreed',
        description: 'Payment terms and schedule have been agreed with customer',
        completed: false,
        required: true
      });
      break;

    case BusinessStage.FULL_PAYMENT:
      requirements.push({
        id: 'partial-payment-received',
        label: 'Partial Payment Received',
        description: 'Initial payment has been received from customer',
        completed: progressInfo.completedStages.includes(BusinessStage.PARTIAL_PAYMENT),
        required: false // Can skip to full payment
      });
      break;

    case BusinessStage.IN_PRODUCTION:
      requirements.push({
        id: 'payment-received',
        label: 'Payment Received',
        description: 'At least partial payment has been received from customer',
        completed: [BusinessStage.PARTIAL_PAYMENT, BusinessStage.FULL_PAYMENT].some(s => 
          progressInfo.completedStages.includes(s)
        ),
        required: true
      });
      requirements.push({
        id: 'vendor-confirmed',
        label: 'Vendor Production Confirmed',
        description: 'Vendor has confirmed they can start production',
        completed: false,
        required: true
      });
      break;

    case BusinessStage.QUALITY_CONTROL:
      requirements.push({
        id: 'production-completed',
        label: 'Production Completed',
        description: 'Vendor has completed production of the order',
        completed: progressInfo.completedStages.includes(BusinessStage.IN_PRODUCTION),
        required: true
      });
      break;

    case BusinessStage.SHIPPING:
      requirements.push({
        id: 'qc-passed',
        label: 'Quality Control Passed',
        description: 'Product has passed quality control inspection',
        completed: progressInfo.completedStages.includes(BusinessStage.QUALITY_CONTROL),
        required: true
      });
      requirements.push({
        id: 'shipping-address-confirmed',
        label: 'Shipping Address Confirmed',
        description: 'Customer shipping address has been confirmed',
        completed: false,
        required: true
      });
      break;

    case BusinessStage.DELIVERED:
      requirements.push({
        id: 'shipped',
        label: 'Order Shipped',
        description: 'Order has been shipped to customer',
        completed: progressInfo.completedStages.includes(BusinessStage.SHIPPING),
        required: true
      });
      requirements.push({
        id: 'delivery-confirmed',
        label: 'Delivery Confirmed',
        description: 'Customer has confirmed receipt of the order',
        completed: false,
        required: true
      });
      break;

    case BusinessStage.CANCELLED:
      requirements.push({
        id: 'cancellation-reason',
        label: 'Cancellation Reason Documented',
        description: 'Reason for cancellation has been documented',
        completed: false,
        required: true
      });
      break;
  }

  return requirements;
};

export function StageAdvancementModal({
  isOpen,
  onClose,
  targetStage,
  currentStatus,
  currentStage,
  timeline = [],
  userPermissions,
  orderId
}: StageAdvancementModalProps) {
  const [notes, setNotes] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showEnhancedConfirmation, setShowEnhancedConfirmation] = useState(false);
  const [requirementChecks, setRequirementChecks] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Use the new advancement hook
  const advanceStage = useAdvanceOrderStage();

  // Early return if targetStage is null
  if (!targetStage) {
    return null;
  }

  const progressInfo = OrderProgressCalculator.calculateProgress(currentStatus);
  const stageInfo = OrderProgressCalculator.getStageInfo(targetStage);
  const requirements = getStageRequirements(targetStage, currentStage, progressInfo, timeline);
  const isCriticalStage = CRITICAL_STAGES.includes(targetStage);

  // Initialize requirement checks
  useEffect(() => {
    const initialChecks: Record<string, boolean> = {};
    requirements.forEach(req => {
      initialChecks[req.id] = req.completed;
    });
    setRequirementChecks(initialChecks);
  }, [targetStage, requirements.length]);

  // Validate advancement requirements
  const validateAdvancement = (): AdvancementValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required fields
    if (!notes.trim()) {
      errors.push('Notes are required for stage advancement');
    }

    // Check required requirements
    const unmetRequiredRequirements = requirements.filter(req => 
      req.required && !requirementChecks[req.id]
    );

    if (unmetRequiredRequirements.length > 0) {
      errors.push(`Please complete all required requirements: ${unmetRequiredRequirements.map(r => r.label).join(', ')}`);
    }

    // Check permissions
    if (!userPermissions.includes('update_order_status')) {
      errors.push('You do not have permission to advance order stages');
    }

    // Add warnings for critical stages
    if (isCriticalStage) {
      warnings.push(`This is a critical stage. Please ensure all requirements are met before proceeding.`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  };

  const handleRequirementChange = (requirementId: string, checked: boolean) => {
    setRequirementChecks(prev => ({
      ...prev,
      [requirementId]: checked
    }));
  };

  const handleAdvance = () => {
    const validation = validateAdvancement();
    setValidationErrors(validation.errors);

    if (!validation.isValid) {
      OrderStatusMessaging.showValidationError(
        validation.errors,
        'Stage Advancement'
      );
      return;
    }

    // Check if enhanced confirmation is needed
    const confirmationConfig = StatusChangeConfirmation.requiresConfirmation(currentStage, targetStage);
    
    if (confirmationConfig.required && confirmationConfig.severity === 'critical') {
      // Use enhanced confirmation dialog for critical changes
      setShowEnhancedConfirmation(true);
    } else if (isCriticalStage) {
      // Use basic confirmation dialog for other critical stages
      setShowConfirmation(true);
    } else {
      executeAdvancement();
    }
  };

  const executeAdvancement = async () => {
    if (!targetStage) return;

    try {
      await advanceStage.mutateAsync({
        id: orderId,
        targetStage: targetStage,
        notes: notes.trim(),
        requirements: requirementChecks
      });
      
      // Success is handled by the hook's onSuccess callback
      onClose();
    } catch (error) {
      // Error is handled by the hook's onError callback
      console.error('Stage advancement failed:', error);
    } finally {
      setShowConfirmation(false);
      setShowEnhancedConfirmation(false);
    }
  };

  const handleEnhancedConfirmation = async (confirmationNotes: string, acknowledgedRisks: string[]) => {
    // Update notes with confirmation notes if provided
    if (confirmationNotes.trim()) {
      setNotes(confirmationNotes.trim());
    }
    
    // Execute the advancement
    await executeAdvancement();
  };

  const handleClose = () => {
    setNotes('');
    setRequirementChecks({});
    setValidationErrors([]);
    setShowConfirmation(false);
    setShowEnhancedConfirmation(false);
    onClose();
  };

  const validation = validateAdvancement();
  const completedRequirements = requirements.filter(req => requirementChecks[req.id]).length;
  const totalRequirements = requirements.length;
  const isLoading = advanceStage.isPending;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2 rounded-lg border bg-blue-50 border-blue-200">
                <ArrowRight className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Advance to {stageInfo.indonesianLabel}</h3>
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Stage Advancement
                </Badge>
              </div>
            </DialogTitle>
            <DialogDescription>
              Complete the requirements below to advance to {stageInfo.indonesianLabel}.
              {isCriticalStage && (
                <span className="block mt-1 text-orange-600 font-medium">
                  ⚠️ This is a critical stage that requires confirmation.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Progress Indicator */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  Requirements Progress
                  <Badge variant="outline">
                    {completedRequirements}/{totalRequirements}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalRequirements > 0 ? (completedRequirements / totalRequirements) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Requirements Checklist */}
            {requirements.length > 0 && (
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-3">
                  Requirements Checklist
                </h4>
                <div className="space-y-3">
                  {requirements.map((requirement) => (
                    <div key={requirement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Checkbox
                        id={requirement.id}
                        checked={requirementChecks[requirement.id] || false}
                        onCheckedChange={(checked) => 
                          handleRequirementChange(requirement.id, checked as boolean)
                        }
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={requirement.id}
                          className="font-medium text-sm cursor-pointer"
                        >
                          {requirement.label}
                          {requirement.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {requirement.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {requirement.required && (
                          <Badge variant="outline" className="text-xs">
                            Required
                          </Badge>
                        )}
                        {requirement.completed && (
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Field */}
            <div className="space-y-2">
              <Label htmlFor="advancement-notes">
                Advancement Notes <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="advancement-notes"
                placeholder="Please provide a reason for advancing to this stage..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className={cn(
                  validationErrors.some(error => error.includes('Notes')) && 
                  "border-red-500 focus:border-red-500"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Explain why you are advancing to this stage and any relevant context.
              </p>
            </div>

            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-800">Validation Errors</span>
                </div>
                <ul className="space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index} className="text-sm text-red-700 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Warnings */}
            {validation.warnings.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span className="font-medium text-orange-800">Important Notice</span>
                </div>
                <ul className="space-y-1">
                  {validation.warnings.map((warning, index) => (
                    <li key={index} className="text-sm text-orange-700 flex items-center gap-2">
                      <ChevronRight className="w-3 h-3" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Stage Information */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">What happens next?</h4>
              <p className="text-sm text-blue-700 mb-3">
                After advancing to {stageInfo.indonesianLabel}:
              </p>
              <ul className="space-y-1">
                <li className="text-sm text-blue-700 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Order status will be updated to reflect the new stage
                </li>
                <li className="text-sm text-blue-700 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Timeline will show the advancement with your notes
                </li>
                <li className="text-sm text-blue-700 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Relevant team members will be notified
                </li>
                <li className="text-sm text-blue-700 flex items-center gap-2">
                  <ChevronRight className="w-3 h-3" />
                  Next stage requirements will become available
                </li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            
            <Button
              onClick={handleAdvance}
              disabled={isLoading || !validation.isValid}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              {isCriticalStage ? 'Review & Confirm' : 'Advance Stage'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog for Critical Stages */}
      <AlertDialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Confirm Critical Stage Advancement
            </AlertDialogTitle>
            <AlertDialogDescription>
              You are about to advance to <strong>{stageInfo.indonesianLabel}</strong>, which is a critical stage in the order workflow.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-4">
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <p className="text-sm text-orange-800 font-medium mb-2">This action will:</p>
              <ul className="text-sm text-orange-700 space-y-1">
                <li>• Update the order status to {stageInfo.indonesianLabel}</li>
                <li>• Record your advancement notes in the order history</li>
                <li>• Notify relevant team members of the status change</li>
                <li>• Make this change permanent in the order timeline</li>
              </ul>
            </div>

            <p className="text-sm">
              Are you sure you want to proceed with this advancement?
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAdvancement}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Advancing...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  Confirm Advancement
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Enhanced Status Change Confirmation Dialog */}
      <StatusChangeConfirmationDialog
        isOpen={showEnhancedConfirmation}
        onClose={() => setShowEnhancedConfirmation(false)}
        onConfirm={handleEnhancedConfirmation}
        fromStage={currentStage}
        toStage={targetStage}
        fromStatus={currentStatus}
        toStatus={OrderProgressCalculator.mapStageToStatus(targetStage)}
        orderId={orderId}
        isLoading={isLoading}
      />
    </>
  );
}

export default StageAdvancementModal;