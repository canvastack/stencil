/**
 * Status Change Confirmation Dialog Component
 * 
 * Enhanced confirmation system for critical status changes with:
 * - Detailed impact summary before confirmation
 * - Contextual notes with suggestions
 * - Risk assessment and warnings
 * - Clear action consequences
 * 
 * COMPLIANCE:
 * - ✅ NO MOCK DATA: All data from OrderProgressCalculator and business rules
 * - ✅ BUSINESS ALIGNMENT: Follows PT CEX business workflow requirements
 * - ✅ USER GUIDANCE: Clear impact summary and next steps
 * - ✅ RISK MANAGEMENT: Appropriate warnings for destructive actions
 */

import React, { useState, useEffect } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  FileText,
  Users,
  DollarSign,
  Truck,
  Factory,
  Shield,
  Info,
  Loader2,
  ChevronRight
} from 'lucide-react';
import { BusinessStage, OrderProgressCalculator } from '@/utils/OrderProgressCalculator';
import { OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

export interface StatusChangeImpact {
  category: 'workflow' | 'financial' | 'customer' | 'vendor' | 'internal';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  icon: React.ComponentType<any>;
}

export interface StatusChangeRisk {
  id: string;
  title: string;
  description: string;
  severity: 'warning' | 'danger';
  mitigation?: string;
}

export interface StatusChangeRequirement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
  validationMessage?: string;
}

export interface StatusChangeConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string, acknowledgedRisks: string[]) => Promise<void>;
  fromStage: BusinessStage;
  toStage: BusinessStage;
  fromStatus: OrderStatus;
  toStatus: OrderStatus;
  orderId: string;
  orderData?: {
    customerName?: string;
    totalAmount?: number;
    itemsCount?: number;
    vendorName?: string;
  };
  isLoading?: boolean;
}

// Define which status changes require confirmation
const CRITICAL_STATUS_CHANGES = new Set([
  // Production-related changes
  `${BusinessStage.FULL_PAYMENT}->${BusinessStage.IN_PRODUCTION}`,
  `${BusinessStage.IN_PRODUCTION}->${BusinessStage.QUALITY_CONTROL}`,
  `${BusinessStage.QUALITY_CONTROL}->${BusinessStage.SHIPPING}`,
  
  // Final stages
  `${BusinessStage.SHIPPING}->${BusinessStage.DELIVERED}`,
  `${BusinessStage.SHIPPING}->${BusinessStage.COMPLETED}`,
  
  // Cancellation from any stage
  `${BusinessStage.DRAFT}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.PENDING}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.VENDOR_SOURCING}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.VENDOR_NEGOTIATION}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.CUSTOMER_QUOTE}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.AWAITING_PAYMENT}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.PARTIAL_PAYMENT}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.FULL_PAYMENT}->${BusinessStage.CANCELLED}`,
  `${BusinessStage.IN_PRODUCTION}->${BusinessStage.CANCELLED}`,
  
  // Rejection scenarios
  `${BusinessStage.QUALITY_CONTROL}->${BusinessStage.IN_PRODUCTION}`, // QC rejection
  `${BusinessStage.CUSTOMER_QUOTE}->${BusinessStage.VENDOR_NEGOTIATION}`, // Quote rejection
]);

// Define destructive actions that cannot be easily undone
const DESTRUCTIVE_ACTIONS = new Set([
  BusinessStage.CANCELLED,
  BusinessStage.COMPLETED,
  BusinessStage.DELIVERED
]);

export function StatusChangeConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  fromStage,
  toStage,
  fromStatus,
  toStatus,
  orderId,
  orderData,
  isLoading = false
}: StatusChangeConfirmationProps) {
  const [notes, setNotes] = useState('');
  const [acknowledgedRisks, setAcknowledgedRisks] = useState<string[]>([]);
  const [requirementsChecked, setRequirementsChecked] = useState<Record<string, boolean>>({});

  const fromStageInfo = OrderProgressCalculator.getStageInfo(fromStage);
  const toStageInfo = OrderProgressCalculator.getStageInfo(toStage);
  
  const changeKey = `${fromStage}->${toStage}`;
  const isDestructive = DESTRUCTIVE_ACTIONS.has(toStage);
  const isCritical = CRITICAL_STATUS_CHANGES.has(changeKey);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setNotes('');
      setAcknowledgedRisks([]);
      setRequirementsChecked({});
    }
  }, [isOpen]);

  // Get impact analysis for this status change
  const getStatusChangeImpacts = (): StatusChangeImpact[] => {
    const impacts: StatusChangeImpact[] = [];

    // Workflow impacts
    impacts.push({
      category: 'workflow',
      title: 'Workflow Progression',
      description: `Order will advance from ${fromStageInfo.indonesianLabel} to ${toStageInfo.indonesianLabel}`,
      severity: 'medium',
      icon: ArrowRight
    });

    // Stage-specific impacts
    switch (toStage) {
      case BusinessStage.IN_PRODUCTION:
        impacts.push({
          category: 'vendor',
          title: 'Production Initiation',
          description: 'Vendor will be notified to begin production. This commits resources and may incur costs.',
          severity: 'high',
          icon: Factory
        });
        impacts.push({
          category: 'financial',
          title: 'Financial Commitment',
          description: 'Production costs will be committed. Cancellation after this point may incur penalties.',
          severity: 'high',
          icon: DollarSign
        });
        break;

      case BusinessStage.QUALITY_CONTROL:
        impacts.push({
          category: 'internal',
          title: 'Quality Inspection Required',
          description: 'Product must undergo quality control inspection before shipment.',
          severity: 'medium',
          icon: Shield
        });
        break;

      case BusinessStage.SHIPPING:
        impacts.push({
          category: 'customer',
          title: 'Customer Notification',
          description: 'Customer will be notified that their order is being shipped.',
          severity: 'medium',
          icon: Users
        });
        impacts.push({
          category: 'internal',
          title: 'Shipping Coordination',
          description: 'Shipping provider will be contacted and delivery will be scheduled.',
          severity: 'medium',
          icon: Truck
        });
        break;

      case BusinessStage.COMPLETED:
        impacts.push({
          category: 'workflow',
          title: 'Order Finalization',
          description: 'Order will be marked as complete and closed. No further changes will be possible.',
          severity: 'critical',
          icon: CheckCircle2
        });
        impacts.push({
          category: 'customer',
          title: 'Customer Satisfaction',
          description: 'Customer will be asked for feedback and the order will be archived.',
          severity: 'low',
          icon: Users
        });
        break;

      case BusinessStage.CANCELLED:
        impacts.push({
          category: 'workflow',
          title: 'Order Cancellation',
          description: 'Order will be permanently cancelled. This action cannot be undone.',
          severity: 'critical',
          icon: XCircle
        });
        impacts.push({
          category: 'customer',
          title: 'Customer Communication',
          description: 'Customer must be notified of the cancellation and refund process initiated.',
          severity: 'high',
          icon: Users
        });
        if (fromStage === BusinessStage.IN_PRODUCTION) {
          impacts.push({
            category: 'vendor',
            title: 'Production Halt',
            description: 'Vendor production must be stopped. Cancellation fees may apply.',
            severity: 'critical',
            icon: Factory
          });
        }
        break;

      case BusinessStage.DELIVERED:
        impacts.push({
          category: 'customer',
          title: 'Delivery Confirmation',
          description: 'Customer has confirmed receipt of their order.',
          severity: 'medium',
          icon: CheckCircle2
        });
        break;
    }

    return impacts;
  };

  // Get risks associated with this status change
  const getStatusChangeRisks = (): StatusChangeRisk[] => {
    const risks: StatusChangeRisk[] = [];

    switch (toStage) {
      case BusinessStage.IN_PRODUCTION:
        risks.push({
          id: 'production-commitment',
          title: 'Production Commitment',
          description: 'Once production starts, cancellation may result in material waste and vendor penalties.',
          severity: 'warning',
          mitigation: 'Ensure all specifications are final and payment is confirmed before proceeding.'
        });
        break;

      case BusinessStage.SHIPPING:
        risks.push({
          id: 'shipping-responsibility',
          title: 'Shipping Responsibility',
          description: 'Once shipped, the company is responsible for delivery and any shipping issues.',
          severity: 'warning',
          mitigation: 'Verify shipping address and ensure proper packaging and insurance.'
        });
        break;

      case BusinessStage.CANCELLED:
        risks.push({
          id: 'cancellation-permanent',
          title: 'Permanent Action',
          description: 'Cancellation cannot be undone. The order cannot be reactivated.',
          severity: 'danger',
          mitigation: 'Consider if the order can be modified instead of cancelled.'
        });
        
        if (fromStage === BusinessStage.IN_PRODUCTION || fromStage === BusinessStage.QUALITY_CONTROL) {
          risks.push({
            id: 'production-waste',
            title: 'Production Waste',
            description: 'Cancelling during or after production may result in material waste and vendor penalties.',
            severity: 'danger',
            mitigation: 'Negotiate with vendor for partial completion or alternative arrangements.'
          });
        }
        break;

      case BusinessStage.COMPLETED:
        risks.push({
          id: 'finalization-permanent',
          title: 'Order Finalization',
          description: 'Completing the order will close it permanently. No further modifications will be possible.',
          severity: 'warning',
          mitigation: 'Ensure all deliverables are complete and customer is satisfied.'
        });
        break;
    }

    return risks;
  };

  // Get requirements for this status change
  const getStatusChangeRequirements = (): StatusChangeRequirement[] => {
    const requirements: StatusChangeRequirement[] = [];

    switch (toStage) {
      case BusinessStage.IN_PRODUCTION:
        requirements.push({
          id: 'payment-confirmed',
          title: 'Payment Confirmation',
          description: 'At least 50% payment must be received before starting production',
          completed: fromStage === BusinessStage.FULL_PAYMENT || fromStage === BusinessStage.PARTIAL_PAYMENT,
          required: true,
          validationMessage: 'Production cannot start without payment confirmation'
        });
        requirements.push({
          id: 'vendor-ready',
          title: 'Vendor Readiness',
          description: 'Vendor has confirmed they can start production immediately',
          completed: false, // This should be manually verified
          required: true
        });
        break;

      case BusinessStage.QUALITY_CONTROL:
        requirements.push({
          id: 'production-complete',
          title: 'Production Completed',
          description: 'Vendor has confirmed production is complete',
          completed: fromStage === BusinessStage.IN_PRODUCTION,
          required: true
        });
        break;

      case BusinessStage.SHIPPING:
        requirements.push({
          id: 'qc-passed',
          title: 'Quality Control Passed',
          description: 'Product has passed all quality control checks',
          completed: fromStage === BusinessStage.QUALITY_CONTROL,
          required: true
        });
        requirements.push({
          id: 'shipping-address',
          title: 'Shipping Address Confirmed',
          description: 'Customer shipping address has been verified',
          completed: false,
          required: true
        });
        break;

      case BusinessStage.DELIVERED:
        requirements.push({
          id: 'delivery-confirmed',
          title: 'Delivery Confirmed',
          description: 'Customer has confirmed receipt of the order',
          completed: false,
          required: true
        });
        break;

      case BusinessStage.CANCELLED:
        requirements.push({
          id: 'cancellation-reason',
          title: 'Cancellation Reason',
          description: 'Detailed reason for cancellation must be documented',
          completed: false,
          required: true,
          validationMessage: 'Cancellation reason is required for audit purposes'
        });
        break;
    }

    return requirements;
  };

  // Get suggested notes based on the status change
  const getSuggestedNotes = (): string[] => {
    const suggestions: string[] = [];

    switch (toStage) {
      case BusinessStage.IN_PRODUCTION:
        suggestions.push('Production started - vendor notified');
        suggestions.push('All specifications confirmed with vendor');
        suggestions.push('Expected completion date: [date]');
        break;

      case BusinessStage.QUALITY_CONTROL:
        suggestions.push('Production completed - beginning QC inspection');
        suggestions.push('Initial visual inspection passed');
        suggestions.push('Detailed QC checklist to be completed');
        break;

      case BusinessStage.SHIPPING:
        suggestions.push('QC passed - approved for shipment');
        suggestions.push('Shipping arranged with [carrier name]');
        suggestions.push('Customer notified of shipment');
        break;

      case BusinessStage.COMPLETED:
        suggestions.push('Order completed successfully');
        suggestions.push('Customer satisfied with delivery');
        suggestions.push('All requirements met');
        break;

      case BusinessStage.CANCELLED:
        suggestions.push('Customer requested cancellation');
        suggestions.push('Unable to meet specifications');
        suggestions.push('Payment issues - order cancelled');
        suggestions.push('Vendor unable to fulfill order');
        break;

      case BusinessStage.DELIVERED:
        suggestions.push('Customer confirmed receipt');
        suggestions.push('Delivery completed without issues');
        suggestions.push('Customer feedback collected');
        break;
    }

    return suggestions;
  };

  const impacts = getStatusChangeImpacts();
  const risks = getStatusChangeRisks();
  const requirements = getStatusChangeRequirements();
  const suggestedNotes = getSuggestedNotes();

  const handleRiskAcknowledgment = (riskId: string, acknowledged: boolean) => {
    setAcknowledgedRisks(prev => 
      acknowledged 
        ? [...prev, riskId]
        : prev.filter(id => id !== riskId)
    );
  };

  const handleRequirementCheck = (requirementId: string, checked: boolean) => {
    setRequirementsChecked(prev => ({
      ...prev,
      [requirementId]: checked
    }));
  };

  const handleSuggestedNoteClick = (suggestion: string) => {
    setNotes(prev => prev ? `${prev}\n${suggestion}` : suggestion);
  };

  const canConfirm = () => {
    // Check if all required requirements are met
    const unmetRequiredRequirements = requirements.filter(req => 
      req.required && !req.completed && !requirementsChecked[req.id]
    );
    
    // Check if all high-severity risks are acknowledged
    const unacknowledgedCriticalRisks = risks.filter(risk => 
      risk.severity === 'danger' && !acknowledgedRisks.includes(risk.id)
    );

    // Notes are required for destructive actions
    const notesRequired = isDestructive && !notes.trim();

    return unmetRequiredRequirements.length === 0 && 
           unacknowledgedCriticalRisks.length === 0 && 
           !notesRequired;
  };

  const handleConfirm = async () => {
    if (!canConfirm()) return;
    
    try {
      await onConfirm(notes.trim(), acknowledgedRisks);
    } catch (error) {
      console.error('Status change confirmation failed:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-lg border",
              isDestructive ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                isDestructive ? "text-red-600" : "text-orange-600"
              )} />
            </div>
            <div>
              <h3 className="text-lg font-semibold">
                Confirm Status Change
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">{fromStageInfo.indonesianLabel}</Badge>
                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                <Badge variant="outline">{toStageInfo.indonesianLabel}</Badge>
              </div>
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isDestructive ? (
              <span className="text-red-600 font-medium">
                ⚠️ This is a destructive action that cannot be easily undone.
              </span>
            ) : isCritical ? (
              <span className="text-orange-600 font-medium">
                ⚠️ This is a critical status change that requires confirmation.
              </span>
            ) : (
              'Please review the impact of this status change before proceeding.'
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          {/* Order Information */}
          {orderData && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Order ID:</span>
                    <span className="ml-2 font-medium">{orderId}</span>
                  </div>
                  {orderData.customerName && (
                    <div>
                      <span className="text-muted-foreground">Customer:</span>
                      <span className="ml-2 font-medium">{orderData.customerName}</span>
                    </div>
                  )}
                  {orderData.totalAmount && (
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="ml-2 font-medium">
                        Rp {orderData.totalAmount.toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {orderData.itemsCount && (
                    <div>
                      <span className="text-muted-foreground">Items:</span>
                      <span className="ml-2 font-medium">{orderData.itemsCount} items</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Impact Analysis */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Info className="w-4 h-4" />
                What will happen?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {impacts.map((impact, index) => (
                  <div key={index} className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border",
                    getSeverityColor(impact.severity)
                  )}>
                    <impact.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{impact.title}</p>
                      <p className="text-xs mt-1 opacity-90">{impact.description}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {impact.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Requirements */}
          {requirements.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {requirements.map((requirement) => (
                    <div key={requirement.id} className="flex items-start gap-3 p-3 border rounded-lg">
                      <Checkbox
                        id={requirement.id}
                        checked={requirement.completed || requirementsChecked[requirement.id] || false}
                        onCheckedChange={(checked) => 
                          !requirement.completed && handleRequirementCheck(requirement.id, checked as boolean)
                        }
                        disabled={requirement.completed}
                        className="mt-0.5"
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={requirement.id}
                          className="font-medium text-sm cursor-pointer"
                        >
                          {requirement.title}
                          {requirement.required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                        </Label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {requirement.description}
                        </p>
                        {requirement.validationMessage && !requirement.completed && !requirementsChecked[requirement.id] && (
                          <p className="text-xs text-red-600 mt-1">
                            {requirement.validationMessage}
                          </p>
                        )}
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
              </CardContent>
            </Card>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Risks & Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {risks.map((risk) => (
                    <div key={risk.id} className={cn(
                      "p-3 rounded-lg border",
                      risk.severity === 'danger' ? "bg-red-50 border-red-200" : "bg-orange-50 border-orange-200"
                    )}>
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id={`risk-${risk.id}`}
                          checked={acknowledgedRisks.includes(risk.id)}
                          onCheckedChange={(checked) => 
                            handleRiskAcknowledgment(risk.id, checked as boolean)
                          }
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <Label 
                            htmlFor={`risk-${risk.id}`}
                            className="font-medium text-sm cursor-pointer"
                          >
                            {risk.title}
                            {risk.severity === 'danger' && (
                              <span className="text-red-500 ml-1">*</span>
                            )}
                          </Label>
                          <p className="text-xs mt-1 opacity-90">
                            {risk.description}
                          </p>
                          {risk.mitigation && (
                            <div className="mt-2 p-2 bg-white/50 rounded text-xs">
                              <span className="font-medium">Mitigation: </span>
                              {risk.mitigation}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={cn(
                            "text-xs",
                            risk.severity === 'danger' ? "text-red-600" : "text-orange-600"
                          )}
                        >
                          {risk.severity}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes {isDestructive && <span className="text-red-500">*</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status-change-notes">
                  Reason for status change
                </Label>
                <Textarea
                  id="status-change-notes"
                  placeholder="Please provide a detailed reason for this status change..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className={cn(
                    isDestructive && !notes.trim() && "border-red-500 focus:border-red-500"
                  )}
                />
                {isDestructive && !notes.trim() && (
                  <p className="text-xs text-red-600">
                    Notes are required for destructive actions
                  </p>
                )}
              </div>

              {/* Suggested Notes */}
              {suggestedNotes.length > 0 && (
                <div>
                  <Label className="text-xs text-muted-foreground">
                    Suggested notes (click to add):
                  </Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {suggestedNotes.map((suggestion, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleSuggestedNoteClick(suggestion)}
                        className="text-xs h-7"
                      >
                        {suggestion}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || !canConfirm()}
            className={cn(
              isDestructive ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <ArrowRight className="w-4 h-4 mr-2" />
                Confirm Status Change
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default StatusChangeConfirmationDialog;