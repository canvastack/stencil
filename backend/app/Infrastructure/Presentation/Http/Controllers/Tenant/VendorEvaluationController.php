<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class VendorEvaluationController extends Controller
{
    /**
     * Get all evaluations for a vendor
     * Endpoint: GET /vendors/{vendorId}/evaluations
     */
    public function index(Request $request, string $vendorId): JsonResponse
    {
        try {
            // Verify vendor exists and belongs to tenant
            $vendor = Vendor::findOrFail((int) $vendorId);
            
            $validated = $request->validate([
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'sort_by' => 'nullable|string|in:created_at,rating,quality_score',
                'sort_order' => 'nullable|string|in:asc,desc',
            ]);

            $perPage = $validated['per_page'] ?? 20;
            $sortBy = $validated['sort_by'] ?? 'created_at';
            $sortOrder = $validated['sort_order'] ?? 'desc';

            // Map sort fields to database columns
            $sortFieldMap = [
                'rating' => 'quality_rating',
                'quality_score' => 'quality_rating',
                'created_at' => 'created_at',
            ];
            $dbSortBy = $sortFieldMap[$sortBy] ?? 'created_at';

            // Get vendor orders with quality ratings as evaluations
            $evaluations = VendorOrder::where('vendor_id', $vendor->id)
                ->whereNotNull('quality_rating')
                ->with(['order'])
                ->orderBy($dbSortBy, $sortOrder)
                ->paginate($perPage);

            $evaluationData = $evaluations->map(function ($vendorOrder) {
                return [
                    'id' => $vendorOrder->id,
                    'uuid' => $vendorOrder->uuid ?? null,
                    'vendor_id' => $vendorOrder->vendor_id,
                    'order_id' => $vendorOrder->order_id,
                    'order_code' => $vendorOrder->order->order_code ?? null,
                    'rating' => $vendorOrder->quality_rating,
                    'quality_score' => $vendorOrder->quality_rating,
                    'delivery_score' => $this->calculateDeliveryScore($vendorOrder),
                    'service_score' => $vendorOrder->service_score ?? null,
                    'communication_score' => $vendorOrder->communication_score ?? null,
                    'comment' => $vendorOrder->notes ?? null,
                    'created_at' => $vendorOrder->created_at->toIso8601String(),
                    'updated_at' => $vendorOrder->updated_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Vendor evaluations retrieved successfully',
                'data' => $evaluationData,
                'meta' => [
                    'current_page' => $evaluations->currentPage(),
                    'per_page' => $evaluations->perPage(),
                    'total' => $evaluations->total(),
                    'last_page' => $evaluations->lastPage(),
                    'vendor_id' => $vendorId,
                    'vendor_name' => $vendor->name,
                    'average_rating' => round($evaluations->avg('quality_rating'), 2),
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendor evaluations',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Create a new evaluation for a vendor
     * Endpoint: POST /vendors/{vendorId}/evaluations
     */
    public function store(Request $request, string $vendorId): JsonResponse
    {
        try {
            // Verify vendor exists and belongs to tenant
            $vendor = Vendor::findOrFail((int) $vendorId);

            $validator = Validator::make($request->all(), [
                'order_id' => 'required|integer|exists:orders,id',
                'rating' => 'required|numeric|min:1|max:5',
                'quality_score' => 'nullable|numeric|min:1|max:5',
                'delivery_score' => 'nullable|numeric|min:1|max:5',
                'service_score' => 'nullable|numeric|min:1|max:5',
                'communication_score' => 'nullable|numeric|min:1|max:5',
                'comment' => 'nullable|string|max:1000',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();

            // Check if vendor order exists
            $vendorOrder = VendorOrder::where('vendor_id', $vendor->id)
                ->where('order_id', $validated['order_id'])
                ->first();

            if (!$vendorOrder) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vendor order relationship not found',
                ], 404);
            }

            // Update vendor order with evaluation data
            $vendorOrder->update([
                'quality_rating' => $validated['quality_score'] ?? $validated['rating'],
                'service_score' => $validated['service_score'] ?? null,
                'communication_score' => $validated['communication_score'] ?? null,
                'notes' => $validated['comment'] ?? null,
            ]);

            // Update vendor's overall rating
            $this->updateVendorAverageRating($vendor);

            return response()->json([
                'success' => true,
                'message' => 'Vendor evaluation created successfully',
                'data' => [
                    'id' => $vendorOrder->id,
                    'vendor_id' => $vendorOrder->vendor_id,
                    'order_id' => $vendorOrder->order_id,
                    'rating' => $vendorOrder->quality_rating,
                    'quality_score' => $vendorOrder->quality_rating,
                    'delivery_score' => $validated['delivery_score'] ?? null,
                    'service_score' => $vendorOrder->service_score,
                    'communication_score' => $vendorOrder->communication_score,
                    'comment' => $vendorOrder->notes,
                    'created_at' => $vendorOrder->created_at->toIso8601String(),
                    'updated_at' => $vendorOrder->updated_at->toIso8601String(),
                ],
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create vendor evaluation',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Calculate delivery score based on delivery status
     */
    private function calculateDeliveryScore($vendorOrder): ?float
    {
        if (!$vendorOrder->delivery_status) {
            return null;
        }

        return match ($vendorOrder->delivery_status) {
            'early' => 5.0,
            'on_time' => 4.5,
            'late' => 2.0,
            default => 3.0,
        };
    }

    /**
     * Update vendor's average rating based on all evaluations
     */
    private function updateVendorAverageRating(Vendor $vendor): void
    {
        $averageRating = VendorOrder::where('vendor_id', $vendor->id)
            ->whereNotNull('quality_rating')
            ->avg('quality_rating');

        if ($averageRating !== null) {
            $vendor->update([
                'rating' => round($averageRating, 2),
            ]);
        }
    }
}
