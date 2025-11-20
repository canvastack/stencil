<?php

namespace App\Http\Controllers;

use App\Models\PaymentRefund;
use App\Models\RefundApprovalWorkflow;
use App\Domain\Payment\Services\RefundService;
use App\Domain\Payment\Services\RefundApprovalService;
use App\Domain\Payment\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class PaymentRefundController extends Controller
{
    public function __construct(
        protected RefundService $refundService,
        protected RefundApprovalService $approvalService,
        protected PaymentGatewayService $gatewayService
    ) {}

    /**
     * Approve a refund request
     */
    public function approve(Request $request, PaymentRefund $refund): JsonResponse
    {
        $validatedData = $request->validate([
            'reason' => 'sometimes|string|max:500',
            'internal_notes' => 'sometimes|string|max:1000',
        ]);

        if (!$refund->requiresApproval()) {
            return response()->json([
                'message' => 'This refund does not require approval or is already processed'
            ], 422);
        }

        try {
            $success = $this->refundService->approveRefund(
                $refund, 
                auth()->id(), 
                $validatedData['reason'] ?? 'Approved via API'
            );

            if ($success) {
                // Add internal notes if provided
                if (!empty($validatedData['internal_notes'])) {
                    $currentNotes = $refund->internal_notes ?? '';
                    $newNotes = $currentNotes . "\n\n[" . now()->format('Y-m-d H:i:s') . "] " . $validatedData['internal_notes'];
                    $refund->update(['internal_notes' => $newNotes]);
                }

                Log::info('Refund approved via API', [
                    'refund_id' => $refund->id,
                    'approved_by' => auth()->id(),
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'message' => 'Refund approved successfully',
                    'data' => $refund->fresh(['approvalWorkflows', 'approvedBy'])
                ]);
            } else {
                return response()->json([
                    'message' => 'Failed to approve refund'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to approve refund', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to approve refund',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject a refund request
     */
    public function reject(Request $request, PaymentRefund $refund): JsonResponse
    {
        $validatedData = $request->validate([
            'reason' => 'required|string|min:10|max:500',
            'internal_notes' => 'sometimes|string|max:1000',
        ]);

        if (!$refund->canBeRejected()) {
            return response()->json([
                'message' => 'This refund cannot be rejected in its current state'
            ], 422);
        }

        try {
            $success = $this->refundService->rejectRefund(
                $refund, 
                auth()->id(), 
                $validatedData['reason']
            );

            if ($success) {
                // Add internal notes if provided
                if (!empty($validatedData['internal_notes'])) {
                    $currentNotes = $refund->internal_notes ?? '';
                    $newNotes = $currentNotes . "\n\n[" . now()->format('Y-m-d H:i:s') . "] " . $validatedData['internal_notes'];
                    $refund->update(['internal_notes' => $newNotes]);
                }

                Log::info('Refund rejected via API', [
                    'refund_id' => $refund->id,
                    'rejected_by' => auth()->id(),
                    'reason' => $validatedData['reason'],
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'message' => 'Refund rejected successfully',
                    'data' => $refund->fresh(['approvalWorkflows'])
                ]);
            } else {
                return response()->json([
                    'message' => 'Failed to reject refund'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to reject refund', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to reject refund',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process an approved refund through payment gateway
     */
    public function process(Request $request, PaymentRefund $refund): JsonResponse
    {
        if (!$refund->canBeProcessed()) {
            return response()->json([
                'message' => 'This refund cannot be processed. It must be approved first.'
            ], 422);
        }

        try {
            $success = $this->refundService->processRefund($refund, auth()->id());

            if ($success) {
                Log::info('Refund processed successfully via API', [
                    'refund_id' => $refund->id,
                    'processed_by' => auth()->id(),
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'message' => 'Refund processed successfully',
                    'data' => $refund->fresh(['order', 'customer'])
                ]);
            } else {
                return response()->json([
                    'message' => 'Refund processing failed. Please check the refund details and try again.',
                    'data' => $refund->fresh()
                ], 422);
            }

        } catch (\Exception $e) {
            Log::error('Failed to process refund', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to process refund',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Check refund status with payment gateway
     */
    public function checkStatus(PaymentRefund $refund): JsonResponse
    {
        try {
            $status = $this->gatewayService->checkRefundStatus($refund);

            return response()->json([
                'data' => [
                    'refund_id' => $refund->id,
                    'current_status' => $refund->status,
                    'gateway_status' => $status,
                    'last_checked' => now()->toISOString()
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to check refund status', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'message' => 'Failed to check refund status',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle workflow step approval
     */
    public function approveWorkflowStep(Request $request, RefundApprovalWorkflow $workflow): JsonResponse
    {
        $validatedData = $request->validate([
            'decision' => 'required|string|in:approved,rejected',
            'reason' => 'required|string|min:5|max:500',
            'metadata' => 'sometimes|array',
        ]);

        if (!$workflow->isPending() || !$workflow->isCurrentStep()) {
            return response()->json([
                'message' => 'This workflow step cannot be processed'
            ], 422);
        }

        if ($workflow->assigned_to !== auth()->id()) {
            return response()->json([
                'message' => 'You are not authorized to process this workflow step'
            ], 403);
        }

        try {
            $success = $validatedData['decision'] === 'approved' 
                ? $workflow->approve(auth()->id(), $validatedData['reason'], $validatedData['metadata'] ?? [])
                : $workflow->reject(auth()->id(), $validatedData['reason'], $validatedData['metadata'] ?? []);

            if ($success) {
                // Complete the workflow step in the service
                $this->approvalService->completeCurrentStep(
                    $workflow->paymentRefund,
                    $validatedData['decision'],
                    auth()->id(),
                    $validatedData['reason']
                );

                Log::info('Workflow step processed via API', [
                    'workflow_id' => $workflow->id,
                    'refund_id' => $workflow->payment_refund_id,
                    'decision' => $validatedData['decision'],
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'message' => "Workflow step {$validatedData['decision']} successfully",
                    'data' => $workflow->fresh(['paymentRefund'])
                ]);
            } else {
                return response()->json([
                    'message' => 'Failed to process workflow step'
                ], 500);
            }

        } catch (\Exception $e) {
            Log::error('Failed to process workflow step', [
                'workflow_id' => $workflow->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to process workflow step',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Escalate workflow step to higher authority
     */
    public function escalateWorkflow(Request $request, RefundApprovalWorkflow $workflow): JsonResponse
    {
        $validatedData = $request->validate([
            'escalated_to_user_id' => 'required|exists:users,id',
            'reason' => 'required|string|min:10|max:500',
        ]);

        if (!$workflow->canBeEscalated()) {
            return response()->json([
                'message' => 'This workflow step cannot be escalated'
            ], 422);
        }

        if ($workflow->assigned_to !== auth()->id()) {
            return response()->json([
                'message' => 'You are not authorized to escalate this workflow step'
            ], 403);
        }

        try {
            $this->approvalService->escalateWorkflowStep(
                $workflow,
                $validatedData['escalated_to_user_id'],
                $validatedData['reason']
            );

            Log::info('Workflow step escalated via API', [
                'workflow_id' => $workflow->id,
                'escalated_to' => $validatedData['escalated_to_user_id'],
                'reason' => $validatedData['reason'],
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Workflow step escalated successfully',
                'data' => $workflow->fresh(['escalatedTo'])
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to escalate workflow step', [
                'workflow_id' => $workflow->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to escalate workflow step',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Bulk approve multiple refunds
     */
    public function bulkApprove(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'refund_ids' => 'required|array|min:1|max:50',
            'refund_ids.*' => 'exists:payment_refunds,id',
            'reason' => 'sometimes|string|max:500',
        ]);

        $refunds = PaymentRefund::whereIn('id', $validatedData['refund_ids'])
            ->where('status', 'pending')
            ->get();

        if ($refunds->isEmpty()) {
            return response()->json([
                'message' => 'No eligible refunds found for approval'
            ], 422);
        }

        $results = [
            'successful' => [],
            'failed' => [],
        ];

        foreach ($refunds as $refund) {
            try {
                $success = $this->refundService->approveRefund(
                    $refund,
                    auth()->id(),
                    $validatedData['reason'] ?? 'Bulk approval via API'
                );

                if ($success) {
                    $results['successful'][] = $refund->id;
                } else {
                    $results['failed'][] = [
                        'id' => $refund->id,
                        'error' => 'Approval failed'
                    ];
                }
            } catch (\Exception $e) {
                $results['failed'][] = [
                    'id' => $refund->id,
                    'error' => $e->getMessage()
                ];
            }
        }

        Log::info('Bulk refund approval via API', [
            'user_id' => auth()->id(),
            'successful_count' => count($results['successful']),
            'failed_count' => count($results['failed'])
        ]);

        return response()->json([
            'message' => 'Bulk approval completed',
            'data' => $results,
            'summary' => [
                'total_requested' => count($validatedData['refund_ids']),
                'successful' => count($results['successful']),
                'failed' => count($results['failed']),
            ]
        ]);
    }

    /**
     * Get available refund processing options
     */
    public function processingOptions(): JsonResponse
    {
        $methods = $this->gatewayService->getSupportedRefundMethods();

        return response()->json([
            'data' => [
                'refund_methods' => $methods,
                'processing_guidelines' => [
                    'minimum_amount' => 1000, // IDR 10
                    'maximum_amount' => 100000000, // IDR 1,000,000
                    'business_hours' => 'Monday to Friday, 9:00 AM - 5:00 PM (WIB)',
                    'processing_time' => [
                        'approval' => '1-3 business days',
                        'gateway_processing' => '3-7 business days',
                        'total_time' => '4-10 business days'
                    ]
                ]
            ]
        ]);
    }

    /**
     * Retry failed refund processing
     */
    public function retry(Request $request, PaymentRefund $refund): JsonResponse
    {
        if ($refund->status !== 'failed') {
            return response()->json([
                'message' => 'Only failed refunds can be retried'
            ], 422);
        }

        $validatedData = $request->validate([
            'refund_method' => 'sometimes|string|in:original_method,bank_transfer,cash,store_credit,manual',
            'refund_details' => 'sometimes|array',
        ]);

        try {
            // Update refund method if provided
            if (!empty($validatedData['refund_method'])) {
                $refund->update([
                    'refund_method' => $validatedData['refund_method'],
                    'refund_details' => $validatedData['refund_details'] ?? $refund->refund_details,
                ]);
            }

            // Reset status to approved for retry
            $refund->update([
                'status' => 'approved',
                'gateway_error_code' => null,
                'gateway_error_message' => null,
            ]);

            // Attempt processing again
            $success = $this->refundService->processRefund($refund, auth()->id());

            Log::info('Refund retry attempted via API', [
                'refund_id' => $refund->id,
                'user_id' => auth()->id(),
                'success' => $success
            ]);

            return response()->json([
                'message' => $success ? 'Refund retry successful' : 'Refund retry failed',
                'data' => $refund->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retry refund', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to retry refund',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}