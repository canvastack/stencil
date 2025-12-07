<?php

namespace App\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\RefundDispute;
use App\Models\PaymentRefund;
use App\Domain\Payment\Services\RefundDisputeService;
use App\Http\Requests\CreateRefundDisputeRequest;
use App\Http\Requests\UpdateRefundDisputeRequest;
use App\Http\Requests\ResolveRefundDisputeRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * RefundDisputeController
 * 
 * Manages dispute resolution workflow for refund requests
 * Provides API endpoints for dispute creation, management, and resolution
 */
class RefundDisputeController extends Controller
{
    public function __construct(
        private RefundDisputeService $disputeService
    ) {}

    /**
     * Get all disputes for tenant with filters
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        $query = RefundDispute::where('tenant_id', $tenantId)
            ->with(['refundRequest.order', 'refundRequest.customer']);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('dispute_reason')) {
            $query->where('dispute_reason', $request->get('dispute_reason'));
        }

        if ($request->has('priority')) {
            $priority = $request->get('priority');
            $query->whereHas('refundRequest', function ($q) use ($priority) {
                match ($priority) {
                    'high' => $q->where('refund_amount', '>', 2000000),
                    'low' => $q->where('refund_amount', '<', 500000),
                    default => $q->whereBetween('refund_amount', [500000, 2000000])
                };
            });
        }

        if ($request->has('overdue')) {
            $query->get()->filter(function (RefundDispute $dispute) {
                return $dispute->isOverdue();
            });
        }

        $disputes = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        // Add computed fields
        $disputes->getCollection()->transform(function (RefundDispute $dispute) {
            return $this->transformDispute($dispute);
        });

        return response()->json([
            'success' => true,
            'data' => $disputes,
        ]);
    }

    /**
     * Create a new dispute
     */
    public function store(CreateRefundDisputeRequest $request): JsonResponse
    {
        try {
            $refund = PaymentRefund::where('id', $request->refund_request_id)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->firstOrFail();

            $dispute = $this->disputeService->createDispute(
                $refund,
                $request->dispute_reason,
                $request->customer_claim,
                $request->evidence_customer ?? []
            );

            return response()->json([
                'success' => true,
                'message' => 'Dispute created successfully',
                'data' => $this->transformDispute($dispute),
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get specific dispute details
     */
    public function show(RefundDispute $dispute): JsonResponse
    {
        // Ensure tenant access
        if ($dispute->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $dispute->load(['refundRequest.order', 'refundRequest.customer']);

        return response()->json([
            'success' => true,
            'data' => $this->transformDispute($dispute, true),
        ]);
    }

    /**
     * Add company response to dispute
     */
    public function addResponse(UpdateRefundDisputeRequest $request, RefundDispute $dispute): JsonResponse
    {
        // Ensure tenant access
        if ($dispute->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $updatedDispute = $this->disputeService->addCompanyResponse(
                $dispute,
                $request->company_response,
                $request->evidence_company ?? [],
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Company response added successfully',
                'data' => $this->transformDispute($updatedDispute),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add response: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Resolve dispute with final decision
     */
    public function resolve(ResolveRefundDisputeRequest $request, RefundDispute $dispute): JsonResponse
    {
        // Ensure tenant access
        if ($dispute->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $resolvedDispute = $this->disputeService->resolveDispute(
                $dispute,
                $request->final_refund_amount,
                $request->resolution_notes,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Dispute resolved successfully',
                'data' => $this->transformDispute($resolvedDispute),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to resolve dispute: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Escalate dispute to mediation
     */
    public function escalate(Request $request, RefundDispute $dispute): JsonResponse
    {
        // Ensure tenant access
        if ($dispute->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'mediator_contact' => 'required|string|max:255',
            'mediation_cost' => 'required|numeric|min:0',
        ]);

        try {
            $escalatedDispute = $this->disputeService->escalateToMediation(
                $dispute,
                $request->mediator_contact,
                $request->mediation_cost,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Dispute escalated to mediation successfully',
                'data' => $this->transformDispute($escalatedDispute),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to escalate dispute: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get disputes requiring attention
     */
    public function requiresAttention(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        $disputes = $this->disputeService->getDisputesRequiringAttention($tenantId);

        return response()->json([
            'success' => true,
            'data' => $disputes->map(function (RefundDispute $dispute) {
                return $this->transformDispute($dispute);
            }),
        ]);
    }

    /**
     * Get dispute statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $statistics = $this->disputeService->getDisputeStatistics($tenantId, $days);
        $disputesByReason = $this->disputeService->getDisputesByReason($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => [
                'statistics' => $statistics,
                'disputes_by_reason' => $disputesByReason,
                'available_reasons' => RefundDispute::getDisputeReasons(),
                'available_statuses' => RefundDispute::getStatuses(),
            ],
        ]);
    }

    /**
     * Get recommendation for dispute resolution
     */
    public function recommendation(RefundDispute $dispute): JsonResponse
    {
        // Ensure tenant access
        if ($dispute->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $recommendation = $this->disputeService->getRecommendedResolution($dispute);

        return response()->json([
            'success' => true,
            'data' => $recommendation,
        ]);
    }

    /**
     * Transform dispute for API response
     */
    private function transformDispute(RefundDispute $dispute, bool $detailed = false): array
    {
        $data = [
            'id' => $dispute->id,
            'refund_request_id' => $dispute->refund_request_id,
            'dispute_reason' => $dispute->dispute_reason,
            'customer_claim' => $dispute->customer_claim,
            'company_response' => $dispute->company_response,
            'status' => $dispute->status,
            'resolution_notes' => $dispute->resolution_notes,
            'final_refund_amount' => $dispute->final_refund_amount,
            'mediator_contact' => $dispute->mediator_contact,
            'mediation_cost' => $dispute->mediation_cost,
            'created_at' => $dispute->created_at,
            'resolved_at' => $dispute->resolved_at,
            
            // Computed fields
            'priority' => $dispute->getPriority(),
            'is_overdue' => $dispute->isOverdue(),
            'is_active' => $dispute->isActive(),
            'expected_resolution_days' => $dispute->getExpectedResolutionDays(),
        ];

        if ($detailed) {
            $data['evidence_customer'] = $dispute->evidence_customer;
            $data['evidence_company'] = $dispute->evidence_company;
            
            if ($dispute->refundRequest) {
                $data['refund_request'] = [
                    'id' => $dispute->refundRequest->id,
                    'refund_reference' => $dispute->refundRequest->refund_reference,
                    'original_amount' => $dispute->refundRequest->refund_amount,
                    'refund_method' => $dispute->refundRequest->refund_method,
                    'order_id' => $dispute->refundRequest->order_id,
                ];
            }
        }

        return $data;
    }
}