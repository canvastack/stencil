<?php

namespace App\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\VendorLiability;
use App\Models\PaymentRefund;
use App\Domain\Payment\Services\VendorLiabilityService;
use App\Http\Requests\CreateVendorLiabilityRequest;
use App\Http\Requests\FileVendorClaimRequest;
use App\Http\Requests\RecordVendorRecoveryRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * VendorLiabilityController
 * 
 * Manages vendor liability tracking and recovery workflow
 * Provides API endpoints for liability creation, claim management, and performance analysis
 */
class VendorLiabilityController extends Controller
{
    public function __construct(
        private VendorLiabilityService $liabilityService
    ) {}

    /**
     * Get all vendor liabilities with filters
     */
    public function index(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        $query = VendorLiability::where('tenant_id', $tenantId)
            ->with(['vendor', 'order', 'refundRequest']);

        // Apply filters
        if ($request->has('vendor_id')) {
            $query->where('vendor_id', $request->get('vendor_id'));
        }

        if ($request->has('status')) {
            $query->where('status', $request->get('status'));
        }

        if ($request->has('reason')) {
            $query->where('reason', $request->get('reason'));
        }

        if ($request->has('priority')) {
            $priority = $request->get('priority');
            $query->get()->filter(function (VendorLiability $liability) use ($priority) {
                return $liability->getPriority() === $priority;
            });
        }

        if ($request->has('overdue')) {
            $query->get()->filter(function (VendorLiability $liability) {
                return $liability->isOverdue();
            });
        }

        $liabilities = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        // Add computed fields
        $liabilities->getCollection()->transform(function (VendorLiability $liability) {
            return $this->transformLiability($liability);
        });

        return response()->json([
            'success' => true,
            'data' => $liabilities,
        ]);
    }

    /**
     * Create vendor liability from refund
     */
    public function createFromRefund(CreateVendorLiabilityRequest $request): JsonResponse
    {
        try {
            $refund = PaymentRefund::where('id', $request->refund_request_id)
                ->where('tenant_id', auth()->user()->tenant_id)
                ->firstOrFail();

            $liability = $this->liabilityService->createLiabilityFromRefund(
                $refund,
                $request->reason,
                $request->liability_amount,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor liability created successfully',
                'data' => $this->transformLiability($liability),
            ], 201);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Create standalone vendor liability
     */
    public function createStandalone(CreateVendorLiabilityRequest $request): JsonResponse
    {
        try {
            $liability = $this->liabilityService->createStandaloneLiability(
                auth()->user()->tenant_id,
                $request->vendor_id,
                $request->order_id,
                $request->liability_amount,
                $request->reason,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor liability created successfully',
                'data' => $this->transformLiability($liability),
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create liability: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get specific liability details
     */
    public function show(VendorLiability $liability): JsonResponse
    {
        // Ensure tenant access
        if ($liability->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $liability->load(['vendor', 'order', 'refundRequest']);

        return response()->json([
            'success' => true,
            'data' => $this->transformLiability($liability, true),
        ]);
    }

    /**
     * File claim with vendor
     */
    public function fileClaim(FileVendorClaimRequest $request, VendorLiability $liability): JsonResponse
    {
        // Ensure tenant access
        if ($liability->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $updatedLiability = $this->liabilityService->fileClaim(
                $liability,
                $request->claim_notes,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Claim filed successfully',
                'data' => $this->transformLiability($updatedLiability),
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Record recovery payment
     */
    public function recordRecovery(RecordVendorRecoveryRequest $request, VendorLiability $liability): JsonResponse
    {
        // Ensure tenant access
        if ($liability->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        try {
            $updatedLiability = $this->liabilityService->recordRecovery(
                $liability,
                $request->recovered_amount,
                $request->recovery_notes,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Recovery recorded successfully',
                'data' => $this->transformLiability($updatedLiability),
            ]);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Mark liability as disputed
     */
    public function markAsDisputed(Request $request, VendorLiability $liability): JsonResponse
    {
        // Ensure tenant access
        if ($liability->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'dispute_notes' => 'required|string|max:1000',
        ]);

        try {
            $updatedLiability = $this->liabilityService->markAsDisputed(
                $liability,
                $request->dispute_notes,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Liability marked as disputed',
                'data' => $this->transformLiability($updatedLiability),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark as disputed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Write off liability
     */
    public function writeOff(Request $request, VendorLiability $liability): JsonResponse
    {
        // Ensure tenant access
        if ($liability->tenant_id !== auth()->user()->tenant_id) {
            abort(403);
        }

        $request->validate([
            'write_off_reason' => 'required|string|max:500',
        ]);

        try {
            $updatedLiability = $this->liabilityService->writeOffLiability(
                $liability,
                $request->write_off_reason,
                auth()->user()
            );

            return response()->json([
                'success' => true,
                'message' => 'Liability written off successfully',
                'data' => $this->transformLiability($updatedLiability),
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to write off liability: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get liabilities requiring attention
     */
    public function requiresAttention(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        $liabilities = $this->liabilityService->getLiabilitiesRequiringAttention($tenantId);

        return response()->json([
            'success' => true,
            'data' => $liabilities->map(function (VendorLiability $liability) {
                return $this->transformLiability($liability);
            }),
        ]);
    }

    /**
     * Get liability statistics
     */
    public function statistics(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);

        $statistics = $this->liabilityService->getLiabilityStatistics($tenantId, $days);

        return response()->json([
            'success' => true,
            'data' => [
                'statistics' => $statistics,
                'available_statuses' => VendorLiability::getStatuses(),
                'available_reasons' => VendorLiability::getLiabilityReasons(),
            ],
        ]);
    }

    /**
     * Get vendor performance analysis
     */
    public function vendorPerformance(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $vendorId = $request->get('vendor_id');
        $days = $request->get('days', 365);

        if (!$vendorId) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor ID is required',
            ], 400);
        }

        $analysis = $this->liabilityService->getVendorPerformanceAnalysis($tenantId, $vendorId, $days);

        return response()->json([
            'success' => true,
            'data' => $analysis,
        ]);
    }

    /**
     * Get vendor recommendations
     */
    public function vendorRecommendations(): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        $recommendations = $this->liabilityService->getVendorRecommendations($tenantId);

        return response()->json([
            'success' => true,
            'data' => $recommendations,
        ]);
    }

    /**
     * Transform liability for API response
     */
    private function transformLiability(VendorLiability $liability, bool $detailed = false): array
    {
        $data = [
            'id' => $liability->id,
            'vendor_id' => $liability->vendor_id,
            'order_id' => $liability->order_id,
            'refund_request_id' => $liability->refund_request_id,
            'liability_amount' => $liability->liability_amount,
            'reason' => $liability->reason,
            'status' => $liability->status,
            'claim_date' => $liability->claim_date,
            'recovery_date' => $liability->recovery_date,
            'recovered_amount' => $liability->recovered_amount,
            'created_at' => $liability->created_at,
            
            // Computed fields
            'priority' => $liability->getPriority(),
            'is_active' => $liability->isActive(),
            'is_claimed' => $liability->isClaimed(),
            'is_overdue' => $liability->isOverdue(),
            'recovery_rate' => $liability->getRecoveryRate(),
            'days_since_claim' => $liability->getDaysSinceClaim(),
            'recommended_action' => $liability->getRecommendedAction(),
        ];

        if ($detailed) {
            $data['recovery_notes'] = $liability->recovery_notes;
            $data['expected_recovery_amount'] = $liability->getExpectedRecoveryAmount();
            
            if ($liability->vendor) {
                $data['vendor'] = [
                    'id' => $liability->vendor->id,
                    'name' => $liability->vendor->name,
                    'email' => $liability->vendor->email,
                ];
            }

            if ($liability->order) {
                $data['order'] = [
                    'id' => $liability->order->id,
                    'order_number' => $liability->order->order_number,
                    'total_amount' => $liability->order->total_amount,
                ];
            }
        }

        return $data;
    }
}