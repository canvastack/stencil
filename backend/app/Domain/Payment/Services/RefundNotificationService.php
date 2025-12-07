<?php

namespace App\Domain\Payment\Services;

use App\Models\PaymentRefund;
use App\Models\RefundApprovalWorkflow;
use App\Infrastructure\Persistence\Eloquent\Models\NotificationTemplate;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Domain\Payment\Mails\RefundRequestedMail;
use App\Domain\Payment\Mails\RefundWorkflowStepAssignedMail;
use App\Domain\Payment\Mails\RefundApprovedMail;
use App\Domain\Payment\Mails\RefundRejectedMail;
use App\Domain\Payment\Mails\RefundCompletedMail;
use App\Domain\Payment\Mails\RefundFailedMail;
use App\Domain\Payment\Mails\RefundWorkflowEscalatedMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class RefundNotificationService
{
    /**
     * Send refund requested notification
     */
    public function sendRefundRequestedNotification(PaymentRefund $refund): void
    {
        try {
            $template = $this->getNotificationTemplate($refund->tenant_id, 'refund.requested');
            
            // Notify customer
            if ($refund->customer && $refund->customer->email) {
                Mail::to($refund->customer->email)
                    ->send(new RefundRequestedMail($refund, 'customer', $template));
            }

            // Notify internal team (CS team)
            $csTeam = $this->getCSTeamMembers($refund->tenant_id);
            foreach ($csTeam as $member) {
                Mail::to($member->email)
                    ->send(new RefundRequestedMail($refund, 'internal', $template));
            }

            // Notify tenant admin
            $tenantAdmin = $this->getTenantAdmin($refund->tenant_id);
            if ($tenantAdmin) {
                Mail::to($tenantAdmin->email)
                    ->send(new RefundRequestedMail($refund, 'admin', $template));
            }

            Log::info('Refund requested notifications sent successfully', [
                'refund_id' => $refund->id,
                'tenant_id' => $refund->tenant_id
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send refund requested notifications', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Send workflow step assigned notification
     */
    public function sendWorkflowStepAssignedNotification(
        RefundApprovalWorkflow $workflow,
        int $assignedToUserId,
        array $stepDetails
    ): void {
        try {
            $template = $this->getNotificationTemplate($workflow->tenant_id, 'refund.workflow.assigned');
            $assignedUser = User::find($assignedToUserId);

            if (!$assignedUser) {
                Log::warning('Cannot send workflow assignment notification - user not found', [
                    'workflow_id' => $workflow->id,
                    'assigned_to' => $assignedToUserId
                ]);
                return;
            }

            Mail::to($assignedUser->email)
                ->send(new RefundWorkflowStepAssignedMail(
                    $workflow->paymentRefund,
                    $workflow,
                    $assignedUser,
                    $stepDetails,
                    $template
                ));

            // Notify supervisor if exists
            if ($assignedUser->supervisor) {
                Mail::to($assignedUser->supervisor->email)
                    ->send(new RefundWorkflowStepAssignedMail(
                        $workflow->paymentRefund,
                        $workflow,
                        $assignedUser,
                        $stepDetails,
                        $template,
                        'supervisor'
                    ));
            }

            Log::info('Workflow step assigned notifications sent successfully', [
                'workflow_id' => $workflow->id,
                'assigned_to' => $assignedToUserId,
                'step' => $stepDetails['step_name'] ?? 'unknown'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send workflow assignment notifications', [
                'workflow_id' => $workflow->id,
                'assigned_to' => $assignedToUserId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send refund approved notification
     */
    public function sendRefundApprovedNotification(PaymentRefund $refund, int $approvedBy): void
    {
        try {
            $template = $this->getNotificationTemplate($refund->tenant_id, 'refund.approved');
            $approver = User::find($approvedBy);

            // Notify customer
            if ($refund->customer && $refund->customer->email) {
                Mail::to($refund->customer->email)
                    ->send(new RefundApprovedMail($refund, $approver, 'customer', $template));
            }

            // Notify finance team for processing
            $financeTeam = $this->getFinanceTeamMembers($refund->tenant_id);
            foreach ($financeTeam as $member) {
                Mail::to($member->email)
                    ->send(new RefundApprovedMail($refund, $approver, 'finance', $template));
            }

            // Notify requester if different from customer
            if ($refund->requested_by && $refund->requestedBy && $refund->requestedBy->email) {
                if (!$refund->customer || $refund->customer->email !== $refund->requestedBy->email) {
                    Mail::to($refund->requestedBy->email)
                        ->send(new RefundApprovedMail($refund, $approver, 'requester', $template));
                }
            }

            Log::info('Refund approved notifications sent successfully', [
                'refund_id' => $refund->id,
                'approved_by' => $approvedBy
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send refund approved notifications', [
                'refund_id' => $refund->id,
                'approved_by' => $approvedBy,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send refund rejected notification
     */
    public function sendRefundRejectedNotification(
        PaymentRefund $refund,
        int $rejectedBy,
        string $rejectionReason
    ): void {
        try {
            $template = $this->getNotificationTemplate($refund->tenant_id, 'refund.rejected');
            $rejector = User::find($rejectedBy);

            // Notify customer
            if ($refund->customer && $refund->customer->email) {
                Mail::to($refund->customer->email)
                    ->send(new RefundRejectedMail($refund, $rejector, $rejectionReason, 'customer', $template));
            }

            // Notify requester if different from customer
            if ($refund->requested_by && $refund->requestedBy && $refund->requestedBy->email) {
                if (!$refund->customer || $refund->customer->email !== $refund->requestedBy->email) {
                    Mail::to($refund->requestedBy->email)
                        ->send(new RefundRejectedMail($refund, $rejector, $rejectionReason, 'requester', $template));
                }
            }

            // Notify CS team for follow-up
            $csTeam = $this->getCSTeamMembers($refund->tenant_id);
            foreach ($csTeam as $member) {
                Mail::to($member->email)
                    ->send(new RefundRejectedMail($refund, $rejector, $rejectionReason, 'cs_team', $template));
            }

            Log::info('Refund rejected notifications sent successfully', [
                'refund_id' => $refund->id,
                'rejected_by' => $rejectedBy,
                'reason' => $rejectionReason
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send refund rejected notifications', [
                'refund_id' => $refund->id,
                'rejected_by' => $rejectedBy,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send refund completed notification
     */
    public function sendRefundCompletedNotification(PaymentRefund $refund, array $gatewayResponse = []): void
    {
        try {
            $template = $this->getNotificationTemplate($refund->tenant_id, 'refund.completed');

            // Notify customer
            if ($refund->customer && $refund->customer->email) {
                Mail::to($refund->customer->email)
                    ->send(new RefundCompletedMail($refund, $gatewayResponse, 'customer', $template));
            }

            // Notify finance team
            $financeTeam = $this->getFinanceTeamMembers($refund->tenant_id);
            foreach ($financeTeam as $member) {
                Mail::to($member->email)
                    ->send(new RefundCompletedMail($refund, $gatewayResponse, 'finance', $template));
            }

            // Notify tenant admin
            $tenantAdmin = $this->getTenantAdmin($refund->tenant_id);
            if ($tenantAdmin) {
                Mail::to($tenantAdmin->email)
                    ->send(new RefundCompletedMail($refund, $gatewayResponse, 'admin', $template));
            }

            Log::info('Refund completed notifications sent successfully', [
                'refund_id' => $refund->id,
                'gateway_response' => $gatewayResponse
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send refund completed notifications', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send refund failed notification
     */
    public function sendRefundFailedNotification(
        PaymentRefund $refund,
        string $failureReason,
        array $gatewayResponse = []
    ): void {
        try {
            $template = $this->getNotificationTemplate($refund->tenant_id, 'refund.failed');

            // Notify finance team immediately
            $financeTeam = $this->getFinanceTeamMembers($refund->tenant_id);
            foreach ($financeTeam as $member) {
                Mail::to($member->email)
                    ->send(new RefundFailedMail($refund, $failureReason, $gatewayResponse, 'finance', $template));
            }

            // Notify CS team
            $csTeam = $this->getCSTeamMembers($refund->tenant_id);
            foreach ($csTeam as $member) {
                Mail::to($member->email)
                    ->send(new RefundFailedMail($refund, $failureReason, $gatewayResponse, 'cs_team', $template));
            }

            // Notify tenant admin
            $tenantAdmin = $this->getTenantAdmin($refund->tenant_id);
            if ($tenantAdmin) {
                Mail::to($tenantAdmin->email)
                    ->send(new RefundFailedMail($refund, $failureReason, $gatewayResponse, 'admin', $template));
            }

            Log::info('Refund failed notifications sent successfully', [
                'refund_id' => $refund->id,
                'failure_reason' => $failureReason
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send refund failed notifications', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Send workflow escalated notification
     */
    public function sendWorkflowEscalatedNotification(
        RefundApprovalWorkflow $workflow,
        int $escalatedToUserId,
        string $escalationReason,
        int $originalAssigneeId
    ): void {
        try {
            $template = $this->getNotificationTemplate($workflow->tenant_id, 'refund.workflow.escalated');
            $escalatedToUser = User::find($escalatedToUserId);
            $originalAssignee = User::find($originalAssigneeId);

            if (!$escalatedToUser) {
                Log::warning('Cannot send workflow escalation notification - escalated user not found', [
                    'workflow_id' => $workflow->id,
                    'escalated_to' => $escalatedToUserId
                ]);
                return;
            }

            // Notify escalated user
            Mail::to($escalatedToUser->email)
                ->send(new RefundWorkflowEscalatedMail(
                    $workflow->paymentRefund,
                    $workflow,
                    $escalatedToUser,
                    $originalAssignee,
                    $escalationReason,
                    $template,
                    'escalated_to'
                ));

            // Notify original assignee
            if ($originalAssignee && $originalAssignee->email) {
                Mail::to($originalAssignee->email)
                    ->send(new RefundWorkflowEscalatedMail(
                        $workflow->paymentRefund,
                        $workflow,
                        $escalatedToUser,
                        $originalAssignee,
                        $escalationReason,
                        $template,
                        'original_assignee'
                    ));
            }

            // Notify tenant admin
            $tenantAdmin = $this->getTenantAdmin($workflow->tenant_id);
            if ($tenantAdmin && $tenantAdmin->id !== $escalatedToUserId) {
                Mail::to($tenantAdmin->email)
                    ->send(new RefundWorkflowEscalatedMail(
                        $workflow->paymentRefund,
                        $workflow,
                        $escalatedToUser,
                        $originalAssignee,
                        $escalationReason,
                        $template,
                        'admin'
                    ));
            }

            Log::info('Workflow escalation notifications sent successfully', [
                'workflow_id' => $workflow->id,
                'escalated_to' => $escalatedToUserId,
                'original_assignee' => $originalAssigneeId,
                'reason' => $escalationReason
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send workflow escalation notifications', [
                'workflow_id' => $workflow->id,
                'escalated_to' => $escalatedToUserId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get notification template
     */
    private function getNotificationTemplate(string $tenantId, string $event): ?NotificationTemplate
    {
        return NotificationTemplate::where('tenant_id', $tenantId)
            ->byEvent($event)
            ->byType('email')
            ->active()
            ->first();
    }

    /**
     * Get CS team members
     */
    private function getCSTeamMembers(string $tenantId): array
    {
        return User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'customer_service');
            })
            ->where('is_active', true)
            ->get()
            ->toArray();
    }

    /**
     * Get finance team members
     */
    private function getFinanceTeamMembers(string $tenantId): array
    {
        return User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['finance_manager', 'finance_staff']);
            })
            ->where('is_active', true)
            ->get()
            ->toArray();
    }

    /**
     * Get tenant admin
     */
    private function getTenantAdmin(string $tenantId): ?User
    {
        return User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) {
                $query->where('name', 'tenant_admin');
            })
            ->where('is_active', true)
            ->first();
    }
}