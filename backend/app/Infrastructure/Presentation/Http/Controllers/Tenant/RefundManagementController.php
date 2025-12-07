<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\{RefundRequest, RefundApproval, Order};
use App\Domain\Order\Services\RefundCalculationEngine;
use App\Domain\Order\Services\RefundApprovalWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class RefundManagementController extends Controller
{
    public function __construct(
        protected RefundApprovalWorkflowService $workflowService
    ) {}

    /**
     * List refund requests with filtering and pagination
     */
    public function index(Request $request): JsonResponse
    {
        $query = RefundRequest::with(['order', 'approvals.approver'])
            ->where('tenant_id', auth()->user()->tenant_id)
            ->orderBy('created_at', 'desc');

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('refund_reason')) {
            $query->where('refund_reason', $request->refund_reason);
        }

        if ($request->has('refund_type')) {
            $query->where('refund_type', $request->refund_type);
        }

        if ($request->has('order_id')) {
            $query->where('order_id', $request->order_id);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('request_number', 'like', "%{$search}%")
                  ->orWhere('customer_notes', 'like', "%{$search}%")
                  ->orWhereHas('order', function ($orderQuery) use ($search) {
                      $orderQuery->where('order_number', 'like', "%{$search}%");
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
            ]
        ]);
    }

    /**
     * Create a new refund request
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|exists:orders,id',
            'refund_reason' => 'required|in:customer_request,quality_issue,timeline_delay,vendor_failure,production_error,shipping_damage',
            'refund_type' => 'required|in:full_refund,partial_refund,replacement_order,credit_note',
            'customer_request_amount' => 'nullable|numeric|min:0',
            'quality_issue_percentage' => 'nullable|numeric|min:0|max:100',
            'delay_days' => 'nullable|integer|min:0',
            'evidence_documents' => 'nullable|array',
            'customer_notes' => 'nullable|string|max:1000',
        ]);

        // Check if order exists and belongs to tenant
        $order = Order::where('id', $request->order_id)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->first();

        if (!$order) {
            return response()->json([
                'message' => 'Order not found or not accessible',
                'errors' => ['order_id' => ['Invalid order ID']]
            ], 422);
        }

        // Check if order is eligible for refund  
        $orderStatus = is_string($order->status) ? $order->status : $order->status->value;
        if (!in_array($orderStatus, ['in_production', 'completed', 'shipped'])) {
            return response()->json([
                'message' => 'Order is not eligible for refund',
                'errors' => ['order_id' => ['Order status does not allow refunds']]
            ], 422);
        }

        // Check if order is within refund time limit (30 days for completed orders)
        if ($orderStatus === 'completed' && $order->updated_at->diffInDays(now()) > 30) {
            return response()->json([
                'message' => 'Order is not eligible for refund',
                'errors' => ['order_id' => ['Refund time limit exceeded']]
            ], 422);
        }

        // Check for duplicate active refund requests
        $existingRefund = RefundRequest::where('order_id', $order->id)
            ->whereNotIn('status', ['rejected', 'processed'])
            ->first();

        if ($existingRefund) {
            return response()->json([
                'message' => 'Active refund request already exists for this order',
                'errors' => ['order_id' => ['Duplicate refund request']]
            ], 422);
        }

        // Create dummy refund request for calculation
        $dummyRefundRequest = new RefundRequest([
            'refund_reason' => $request->refund_reason,
            'refund_type' => $request->refund_type,
            'customer_request_amount' => $request->customer_request_amount,
            'quality_issue_percentage' => $request->quality_issue_percentage ?? 100,
            'delay_days' => $request->delay_days,
        ]);

        // Calculate refund amount using the engine
        $calculation = RefundCalculationEngine::calculate($order, $dummyRefundRequest);

        // Create refund request with calculation
        $refundRequest = RefundRequest::create([
            'tenant_id' => auth()->user()->tenant_id,
            'order_id' => $order->id,
            'refund_reason' => $request->refund_reason,
            'refund_type' => $request->refund_type,
            'customer_request_amount' => $request->customer_request_amount,
            'quality_issue_percentage' => $request->quality_issue_percentage ?? 100,
            'delay_days' => $request->delay_days,
            'evidence_documents' => $request->evidence_documents,
            'customer_notes' => $request->customer_notes,
            'requested_by' => auth()->id(),
            'status' => 'pending_review',
            'calculation' => $calculation->toArray(),
        ]);

        // Start approval workflow
        $this->workflowService->initializeWorkflow($refundRequest);

        $refundRequest->load('order');

        return response()->json([
            'data' => $refundRequest,
            'message' => 'Refund request created successfully'
        ], 201);
    }

    /**
     * Show a specific refund request
     */
    public function show(string $requestNumber): JsonResponse
    {
        $refundRequest = RefundRequest::with(['order', 'approvals.approver', 'requestedBy'])
            ->where('request_number', $requestNumber)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->first();

        if (!$refundRequest) {
            return response()->json([
                'message' => 'Refund request not found'
            ], 404);
        }

        // Generate timeline from approvals and status changes
        $timeline = collect();
        
        $timeline->push([
            'action' => 'created',
            'user' => $refundRequest->requestedBy?->name ?? 'System',
            'timestamp' => $refundRequest->created_at->toISOString(),
            'notes' => 'Refund request created'
        ]);

        foreach ($refundRequest->approvals as $approval) {
            $timeline->push([
                'action' => $approval->decision,
                'user' => $approval->approver?->name ?? 'Unknown',
                'timestamp' => $approval->decided_at->toISOString(),
                'notes' => $approval->decision_notes ?? ''
            ]);
        }

        $refundRequest->setAttribute('timeline', $timeline->sortBy('timestamp')->values());

        return response()->json([
            'data' => $refundRequest
        ]);
    }

    /**
     * Update a refund request (only if not yet approved)
     */
    public function update(Request $request, string $requestNumber): JsonResponse
    {
        $refundRequest = RefundRequest::where('request_number', $requestNumber)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->first();

        if (!$refundRequest) {
            return response()->json([
                'message' => 'Refund request not found'
            ], 404);
        }

        if (!in_array($refundRequest->status, ['pending_review', 'needs_info'])) {
            return response()->json([
                'message' => 'Cannot update refund request in current status',
                'errors' => ['status' => ['Request already processed or approved']]
            ], 422);
        }

        $request->validate([
            'customer_request_amount' => 'nullable|numeric|min:0',
            'quality_issue_percentage' => 'nullable|numeric|min:0|max:100',
            'delay_days' => 'nullable|integer|min:0',
            'evidence_documents' => 'nullable|array',
            'customer_notes' => 'nullable|string|max:1000',
        ]);

        $refundRequest->update($request->only([
            'customer_request_amount',
            'quality_issue_percentage',
            'delay_days',
            'evidence_documents',
            'customer_notes'
        ]));

        // Recalculate if amounts changed
        if ($request->has(['customer_request_amount', 'quality_issue_percentage', 'delay_days'])) {
            $order = $refundRequest->order;
            $calculation = RefundCalculationEngine::calculate($order, $refundRequest);
            $refundRequest->update(['calculation' => $calculation->toArray()]);
        }

        return response()->json([
            'data' => $refundRequest,
            'message' => 'Refund request updated successfully'
        ]);
    }

    /**
     * Submit approval decision
     */
    public function approve(Request $request, string $requestNumber): JsonResponse
    {
        $request->validate([
            'decision' => 'required|in:approved,rejected,needs_info',
            'decision_notes' => 'nullable|string|max:1000',
            'adjusted_amount' => 'nullable|numeric|min:0',
        ]);

        $refundRequest = RefundRequest::where('request_number', $requestNumber)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->first();

        if (!$refundRequest) {
            return response()->json([
                'message' => 'Refund request not found'
            ], 404);
        }

        // Check if user is authorized to approve at current level
        if ($refundRequest->current_approver_id !== auth()->id()) {
            return response()->json([
                'message' => 'Not authorized to approve this refund request'
            ], 403);
        }

        try {
            $this->workflowService->processApproval($refundRequest, auth()->user(), [
                'approval_level' => 1, // Default to finance level
                'decision' => $request->decision,
                'decision_notes' => $request->decision_notes,
                'reviewed_calculation' => null,
                'adjusted_amount' => $request->adjusted_amount,
            ]);

            $refundRequest->refresh();
            $refundRequest->load('approvals.approver');
            
            // Add latest approval info to response
            $latestApproval = $refundRequest->approvals->sortByDesc('decided_at')->first();
            $refundRequest->setAttribute('decision', $latestApproval?->decision);
            $refundRequest->setAttribute('approval_level', $latestApproval?->approval_level);

            return response()->json([
                'data' => $refundRequest,
                'message' => 'Approval decision submitted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to process approval',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get approval history for a refund request
     */
    public function approvals(string $requestNumber): JsonResponse
    {
        $refundRequest = RefundRequest::with('approvals.approver')
            ->where('request_number', $requestNumber)
            ->where('tenant_id', auth()->user()->tenant_id)
            ->first();

        if (!$refundRequest) {
            return response()->json([
                'message' => 'Refund request not found'
            ], 404);
        }

        return response()->json([
            'data' => $refundRequest->approvals
        ]);
    }

    /**
     * Get refund statistics
     */
    public function statistics(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        $refunds = RefundRequest::where('tenant_id', $tenantId)->get();
        
        $stats = [
            'total_requests' => $refunds->count(),
            'pending_requests' => $refunds->whereIn('status', ['pending_review', 'pending_finance', 'pending_manager'])->count(),
            'approved_requests' => $refunds->where('status', 'approved')->count(),
            'rejected_requests' => $refunds->where('status', 'rejected')->count(),
            'total_refund_amount' => $refunds->filter(function ($request) {
                    return $request->status === 'processed' && isset($request->calculation['refundableToCustomer']);
                })->sum(function ($request) {
                    return $request->calculation['refundableToCustomer'] ?? 0;
                }),
            'by_reason' => $refunds->groupBy('refund_reason')->map(function ($group, $reason) {
                return ['reason' => $reason, 'count' => $group->count()];
            })->values(),
            'by_status' => $refunds->groupBy('status')->map(function ($group, $status) {
                return ['status' => $status, 'count' => $group->count()];
            })->values(),
            'recent_requests' => $refunds->sortByDesc('created_at')->take(5)->values(),
            'monthly_trend' => $refunds->groupBy(function ($request) {
                    return $request->created_at->format('Y-m');
                })->map(function ($group, $month) {
                    return [
                        'month' => $month,
                        'count' => $group->count(),
                        'amount' => $group->filter(function ($request) {
                            return $request->status === 'processed' && isset($request->calculation['refundableToCustomer']);
                        })->sum(function ($request) {
                            return $request->calculation['refundableToCustomer'] ?? 0;
                        })
                    ];
                })->values(),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }
}