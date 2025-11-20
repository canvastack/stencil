<?php

namespace App\Http\Controllers;

use App\Models\PaymentRefund;
use App\Models\RefundApprovalWorkflow;
use App\Domain\Payment\Services\RefundService;
use App\Domain\Payment\Services\RefundApprovalService;
use App\Domain\Payment\Enums\RefundStatus;
use App\Domain\Payment\Enums\RefundReasonCategory;
use App\Domain\Payment\Enums\RefundMethod;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Log;

class RefundController extends Controller
{
    public function __construct(
        protected RefundService $refundService,
        protected RefundApprovalService $approvalService
    ) {}

    /**
     * Get list of refunds with filtering and pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = PaymentRefund::with(['order', 'customer', 'vendor', 'initiatedBy'])
            ->orderBy('requested_at', 'desc');

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('reason_category')) {
            $query->where('reason_category', $request->reason_category);
        }

        if ($request->has('refund_method')) {
            $query->where('refund_method', $request->refund_method);
        }

        if ($request->has('customer_id')) {
            $query->where('customer_id', $request->customer_id);
        }

        if ($request->has('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        if ($request->has('is_disputed')) {
            $query->where('is_disputed', $request->boolean('is_disputed'));
        }

        if ($request->has('amount_min')) {
            $query->where('refund_amount', '>=', $request->integer('amount_min'));
        }

        if ($request->has('amount_max')) {
            $query->where('refund_amount', '<=', $request->integer('amount_max'));
        }

        if ($request->has('date_from')) {
            $query->whereDate('requested_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('requested_at', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('refund_reference', 'like', "%{$search}%")
                  ->orWhere('reason', 'like', "%{$search}%")
                  ->orWhereHas('order', function ($orderQuery) use ($search) {
                      $orderQuery->where('order_number', 'like', "%{$search}%");
                  })
                  ->orWhereHas('customer', function ($customerQuery) use ($search) {
                      $customerQuery->where('name', 'like', "%{$search}%")
                                   ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        $perPage = $request->integer('per_page', 15);
        $refunds = $query->paginate($perPage);

        return response()->json([
            'data' => $refunds->items(),
            'meta' => [
                'current_page' => $refunds->currentPage(),
                'last_page' => $refunds->lastPage(),
                'per_page' => $refunds->perPage(),
                'total' => $refunds->total(),
                'from' => $refunds->firstItem(),
                'to' => $refunds->lastItem(),
            ],
            'filters' => [
                'status_options' => RefundStatus::cases(),
                'reason_categories' => RefundReasonCategory::cases(),
                'refund_methods' => RefundMethod::cases(),
            ]
        ]);
    }

    /**
     * Get single refund details
     */
    public function show(PaymentRefund $refund): JsonResponse
    {
        $refund->load([
            'order.customer',
            'order.vendor',
            'customer',
            'vendor',
            'originalTransaction',
            'initiatedBy',
            'approvedBy',
            'processedBy',
            'approvalWorkflows.assignedTo',
            'approvalWorkflows.decidedBy'
        ]);

        return response()->json([
            'data' => $refund,
            'summary' => $this->refundService->getOrderRefundSummary($refund->order_id),
            'workflow_status' => [
                'has_active_workflow' => $refund->hasActiveWorkflow(),
                'current_step' => $refund->getCurrentWorkflowStep(),
                'total_steps' => $refund->approvalWorkflows->count(),
                'completed_steps' => $refund->approvalWorkflows->where('is_completed', true)->count(),
            ]
        ]);
    }

    /**
     * Create new refund request
     */
    public function store(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'original_transaction_id' => 'required|exists:order_payment_transactions,id',
            'refund_amount' => 'required|integer|min:1000', // Minimum IDR 10
            'currency' => 'sometimes|string|size:3',
            'refund_method' => 'sometimes|string|in:original_method,bank_transfer,cash,store_credit,manual',
            'refund_details' => 'sometimes|array',
            'reason_category' => 'required|string|in:customer_request,order_cancellation,product_defect,shipping_issue,duplicate_payment,fraud,other',
            'reason' => 'required|string|min:10|max:1000',
            'internal_notes' => 'sometimes|string|max:2000',
            'supporting_documents' => 'sometimes|array',
            'supporting_documents.*' => 'string',
            'is_disputed' => 'sometimes|boolean',
        ]);

        try {
            $refund = $this->refundService->createRefundRequest($validatedData);

            Log::info('Refund request created via API', [
                'refund_id' => $refund->id,
                'user_id' => auth()->id(),
                'ip' => $request->ip()
            ]);

            return response()->json([
                'message' => 'Refund request created successfully',
                'data' => $refund->load(['order', 'customer', 'approvalWorkflows'])
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Failed to create refund request', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'data' => $validatedData
            ]);

            return response()->json([
                'message' => 'Failed to create refund request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update refund details
     */
    public function update(Request $request, PaymentRefund $refund): JsonResponse
    {
        // Only allow updates for pending refunds
        if (!$refund->isPending()) {
            return response()->json([
                'message' => 'Cannot update refund in current status'
            ], 422);
        }

        $validatedData = $request->validate([
            'refund_amount' => 'sometimes|integer|min:1000',
            'refund_method' => 'sometimes|string|in:original_method,bank_transfer,cash,store_credit,manual',
            'refund_details' => 'sometimes|array',
            'reason_category' => 'sometimes|string|in:customer_request,order_cancellation,product_defect,shipping_issue,duplicate_payment,fraud,other',
            'reason' => 'sometimes|string|min:10|max:1000',
            'internal_notes' => 'sometimes|string|max:2000',
            'supporting_documents' => 'sometimes|array',
            'supporting_documents.*' => 'string',
            'is_disputed' => 'sometimes|boolean',
        ]);

        try {
            // Validate refund amount if updated
            if (isset($validatedData['refund_amount'])) {
                $orderSummary = $this->refundService->getOrderRefundSummary($refund->order_id);
                $maxRefundable = $orderSummary['total_refundable'] + $refund->refund_amount; // Add back current refund amount
                
                if ($validatedData['refund_amount'] > $maxRefundable) {
                    return response()->json([
                        'message' => 'Refund amount exceeds available amount',
                        'errors' => [
                            'refund_amount' => ["Cannot exceed {$maxRefundable}"]
                        ]
                    ], 422);
                }
            }

            $refund->update($validatedData);

            Log::info('Refund updated via API', [
                'refund_id' => $refund->id,
                'user_id' => auth()->id(),
                'changes' => array_keys($validatedData)
            ]);

            return response()->json([
                'message' => 'Refund updated successfully',
                'data' => $refund->fresh(['order', 'customer'])
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update refund', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to update refund',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel refund request
     */
    public function destroy(PaymentRefund $refund): JsonResponse
    {
        if (!$refund->isPending()) {
            return response()->json([
                'message' => 'Can only cancel pending refunds'
            ], 422);
        }

        try {
            $refund->update(['status' => 'rejected']);

            // Cancel any active workflows
            RefundApprovalWorkflow::where('payment_refund_id', $refund->id)
                ->where('is_completed', false)
                ->update([
                    'decision' => 'rejected',
                    'decided_by' => auth()->id(),
                    'decided_at' => now(),
                    'decision_reason' => 'Refund request cancelled',
                    'is_completed' => true,
                    'is_current_step' => false
                ]);

            Log::info('Refund cancelled via API', [
                'refund_id' => $refund->id,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Refund request cancelled successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to cancel refund', [
                'refund_id' => $refund->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to cancel refund',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get refund statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after_or_equal:start_date',
        ]);

        $tenantId = app('current_tenant')->id;
        $startDate = isset($validatedData['start_date']) ? \Carbon\Carbon::parse($validatedData['start_date']) : null;
        $endDate = isset($validatedData['end_date']) ? \Carbon\Carbon::parse($validatedData['end_date']) : null;

        $statistics = $this->refundService->getRefundStatistics($tenantId, $startDate, $endDate);

        return response()->json([
            'data' => $statistics,
            'period' => [
                'start_date' => $startDate?->toDateString(),
                'end_date' => $endDate?->toDateString(),
            ]
        ]);
    }

    /**
     * Get refund summary for an order
     */
    public function orderSummary(int $orderId): JsonResponse
    {
        try {
            $summary = $this->refundService->getOrderRefundSummary($orderId);

            return response()->json([
                'data' => $summary
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Order not found or access denied'
            ], 404);
        }
    }

    /**
     * Get workflow history for a refund
     */
    public function workflowHistory(PaymentRefund $refund): JsonResponse
    {
        $workflows = $refund->approvalWorkflows()
            ->with(['assignedTo', 'decidedBy', 'escalatedTo'])
            ->orderBy('step_number')
            ->get();

        return response()->json([
            'data' => $workflows,
            'summary' => [
                'total_steps' => $workflows->count(),
                'completed_steps' => $workflows->where('is_completed', true)->count(),
                'current_step' => $workflows->where('is_current_step', true)->first()?->step_number,
                'workflow_status' => $refund->hasActiveWorkflow() ? 'active' : 'completed'
            ]
        ]);
    }

    /**
     * Get pending workflow items for current user
     */
    public function pendingWorkflows(Request $request): JsonResponse
    {
        $pendingItems = $this->approvalService->getPendingWorkflowItems(auth()->id());

        return response()->json([
            'data' => $pendingItems,
            'count' => $pendingItems->count(),
            'overdue_count' => $pendingItems->where('is_overdue', true)->count()
        ]);
    }

    /**
     * Export refunds data
     */
    public function export(Request $request): JsonResponse
    {
        $validatedData = $request->validate([
            'format' => 'sometimes|string|in:csv,excel,pdf',
            'filters' => 'sometimes|array',
        ]);

        // This would typically integrate with Laravel Excel or similar
        // For now, return a mock response
        return response()->json([
            'message' => 'Export functionality not yet implemented',
            'format' => $validatedData['format'] ?? 'csv',
            'filters' => $validatedData['filters'] ?? []
        ], 501);
    }
}