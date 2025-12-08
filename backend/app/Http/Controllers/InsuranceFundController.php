<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use App\Domain\Payment\Services\RefundAnalyticsService;
use App\Infrastructure\Persistence\Eloquent\Models\InsuranceFundTransaction;

class InsuranceFundController extends Controller
{
    public function __construct(
        protected RefundAnalyticsService $analyticsService
    ) {}

    /**
     * Get insurance fund balance
     */
    public function balance(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        
        $balance = $this->analyticsService->getInsuranceFundStatus($tenantId);
        
        return response()->json([
            'success' => true,
            'data' => $balance,
        ]);
    }

    /**
     * Get insurance fund transactions
     */
    public function transactions(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $perPage = $request->get('per_page', 10);
        
        $transactions = InsuranceFundTransaction::where('tenant_id', $tenantId)
            ->with(['refundRequest'])
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
        
        return response()->json([
            'success' => true,
            'data' => $transactions->items(),
            'meta' => [
                'current_page' => $transactions->currentPage(),
                'per_page' => $transactions->perPage(),
                'total' => $transactions->total(),
                'last_page' => $transactions->lastPage(),
            ],
        ]);
    }

    /**
     * Get insurance fund analytics
     */
    public function analytics(Request $request): JsonResponse
    {
        $tenantId = auth()->user()->tenant_id;
        $days = $request->get('days', 30);
        
        $analytics = $this->analyticsService->getInsuranceFundAnalytics($tenantId, $days);
        
        return response()->json([
            'success' => true,
            'data' => $analytics,
        ]);
    }
}