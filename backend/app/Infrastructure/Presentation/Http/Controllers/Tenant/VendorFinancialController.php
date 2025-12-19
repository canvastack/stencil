<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\VendorPayment;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Domain\Vendor\Services\VendorFinancialService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VendorFinancialController extends Controller
{
    public function __construct(
        private VendorFinancialService $financialService
    ) {}

    /**
     * Get comprehensive financial overview
     */
    public function getFinancialOverview(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'status' => 'nullable|string|in:pending,processing,paid,overdue,cancelled',
            ]);

            $dateFrom = $validated['date_from'] ? Carbon::parse($validated['date_from']) : now()->subMonths(12);
            $dateTo = $validated['date_to'] ? Carbon::parse($validated['date_to']) : now();
            $vendorId = $validated['vendor_id'] ?? null;
            $status = $validated['status'] ?? null;

            $overview = $this->financialService->getFinancialOverview($dateFrom, $dateTo, $vendorId, $status);

            return response()->json([
                'success' => true,
                'message' => 'Financial overview retrieved successfully',
                'data' => $overview,
                'meta' => [
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'vendor_id' => $vendorId,
                    'status' => $status,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve financial overview',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get cash flow analysis
     */
    public function getCashFlowAnalysis(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => 'nullable|string|in:daily,weekly,monthly,quarterly',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
            ]);

            $period = $validated['period'] ?? 'monthly';
            $dateFrom = $validated['date_from'] ? Carbon::parse($validated['date_from']) : now()->subMonths(6);
            $dateTo = $validated['date_to'] ? Carbon::parse($validated['date_to']) : now();
            $vendorId = $validated['vendor_id'] ?? null;

            $cashFlow = $this->financialService->getCashFlowAnalysis($period, $dateFrom, $dateTo, $vendorId);

            return response()->json([
                'success' => true,
                'message' => 'Cash flow analysis retrieved successfully',
                'data' => $cashFlow,
                'meta' => [
                    'period' => $period,
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'vendor_id' => $vendorId,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cash flow analysis',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor profitability analysis
     */
    public function getVendorProfitability(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'min_orders' => 'nullable|integer|min:1',
                'sort_by' => 'nullable|string|in:total_revenue,total_profit,profit_margin,order_count',
                'sort_order' => 'nullable|string|in:asc,desc',
                'limit' => 'nullable|integer|min:1|max:100',
            ]);

            $dateFrom = $validated['date_from'] ? Carbon::parse($validated['date_from']) : now()->subMonths(12);
            $dateTo = $validated['date_to'] ? Carbon::parse($validated['date_to']) : now();
            $minOrders = $validated['min_orders'] ?? 1;
            $sortBy = $validated['sort_by'] ?? 'total_profit';
            $sortOrder = $validated['sort_order'] ?? 'desc';
            $limit = $validated['limit'] ?? 20;

            $profitability = $this->financialService->getVendorProfitability(
                $dateFrom, $dateTo, $minOrders, $sortBy, $sortOrder, $limit
            );

            return response()->json([
                'success' => true,
                'message' => 'Vendor profitability analysis retrieved successfully',
                'data' => $profitability,
                'meta' => [
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'min_orders' => $minOrders,
                    'sort_by' => $sortBy,
                    'sort_order' => $sortOrder,
                    'limit' => $limit,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve vendor profitability',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get payment schedule and projections
     */
    public function getPaymentSchedule(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date|after_or_equal:date_from',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'include_projections' => 'nullable|boolean',
            ]);

            $dateFrom = $validated['date_from'] ? Carbon::parse($validated['date_from']) : now();
            $dateTo = $validated['date_to'] ? Carbon::parse($validated['date_to']) : now()->addMonths(3);
            $vendorId = $validated['vendor_id'] ?? null;
            $includeProjections = $validated['include_projections'] ?? true;

            $schedule = $this->financialService->getPaymentSchedule($dateFrom, $dateTo, $vendorId, $includeProjections);

            return response()->json([
                'success' => true,
                'message' => 'Payment schedule retrieved successfully',
                'data' => $schedule,
                'meta' => [
                    'date_from' => $dateFrom->toDateString(),
                    'date_to' => $dateTo->toDateString(),
                    'vendor_id' => $vendorId,
                    'include_projections' => $includeProjections,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payment schedule',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Create payment plan for order
     */
    public function createPaymentPlan(Request $request, Order $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_id' => 'required|integer|exists:vendors,id',
                'total_amount' => 'required|numeric|min:0',
                'payment_type' => 'required|string|in:down_payment,full_payment,installments',
                'down_payment_percentage' => 'nullable|numeric|min:0|max:100',
                'down_payment_amount' => 'nullable|numeric|min:0',
                'installment_count' => 'nullable|integer|min:2|max:12',
                'payment_terms_days' => 'nullable|integer|min:1|max:365',
                'notes' => 'nullable|string|max:1000',
            ]);

            $paymentPlan = $this->financialService->createPaymentPlan($order, [
                'vendor_id' => $validated['vendor_id'],
                'total_amount' => $validated['total_amount'],
                'payment_type' => $validated['payment_type'],
                'down_payment_percentage' => $validated['down_payment_percentage'] ?? null,
                'down_payment_amount' => $validated['down_payment_amount'] ?? null,
                'installment_count' => $validated['installment_count'] ?? null,
                'payment_terms_days' => $validated['payment_terms_days'] ?? 30,
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment plan created successfully',
                'data' => $paymentPlan,
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment plan',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Process payment disbursement
     */
    public function processDisbursement(Request $request, VendorPayment $payment): JsonResponse
    {
        try {
            $validated = $request->validate([
                'disbursement_method' => 'required|string|in:bank_transfer,digital_wallet,check',
                'bank_account_id' => 'nullable|string|required_if:disbursement_method,bank_transfer',
                'wallet_account' => 'nullable|string|required_if:disbursement_method,digital_wallet',
                'reference_number' => 'nullable|string|max:100',
                'notes' => 'nullable|string|max:1000',
            ]);

            $result = $this->financialService->processDisbursement($payment, [
                'disbursement_method' => $validated['disbursement_method'],
                'bank_account_id' => $validated['bank_account_id'] ?? null,
                'wallet_account' => $validated['wallet_account'] ?? null,
                'reference_number' => $validated['reference_number'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'processed_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Payment disbursement processed successfully',
                'data' => $result,
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to process disbursement',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }
}