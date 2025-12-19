<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Domain\Vendor\Services\VendorMatchingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class VendorMatchingController extends Controller
{
    public function __construct(
        private VendorMatchingService $vendorMatchingService
    ) {}

    /**
     * Get vendor matches for an order
     */
    public function getMatches(Request $request, Order $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'quality_tier' => 'nullable|string|in:standard,premium,exclusive',
                'max_lead_time' => 'nullable|integer|min:1',
                'budget_range' => 'nullable|array',
                'budget_range.min' => 'nullable|numeric|min:0',
                'budget_range.max' => 'nullable|numeric|min:0',
                'specializations' => 'nullable|array',
                'specializations.*' => 'string',
                'limit' => 'nullable|integer|min:1|max:50',
            ]);

            $criteria = [
                'quality_tier' => $validated['quality_tier'] ?? null,
                'max_lead_time' => $validated['max_lead_time'] ?? null,
                'budget_range' => $validated['budget_range'] ?? null,
                'specializations' => $validated['specializations'] ?? [],
                'order_value' => $order->total_amount,
                'order_requirements' => $order->items ?? [],
            ];

            $matches = $this->vendorMatchingService->findMatches($order, $criteria);
            $limit = $validated['limit'] ?? 10;

            // Transform and limit results
            $transformedMatches = collect($matches)->take($limit)->map(function ($match) {
                return [
                    'vendor_id' => $match['vendor']->id,
                    'vendor_uuid' => $match['vendor']->uuid,
                    'vendor_name' => $match['vendor']->name,
                    'vendor_code' => $match['vendor']->code,
                    'quality_tier' => $match['vendor']->quality_tier,
                    'compatibility_score' => $match['compatibility_score'],
                    'estimated_price' => $match['estimated_price'],
                    'estimated_lead_time' => $match['estimated_lead_time'],
                    'specialization_match' => $match['specialization_match'],
                    'past_performance' => $match['past_performance'],
                    'availability_status' => $match['availability_status'],
                    'location' => $match['vendor']->location,
                    'contact_person' => $match['vendor']->contact_person,
                    'phone' => $match['vendor']->phone,
                    'email' => $match['vendor']->email,
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Vendor matches retrieved successfully',
                'data' => $transformedMatches,
                'meta' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'total_matches' => count($matches),
                    'limit_applied' => $limit,
                    'criteria' => $criteria,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to get vendor matches', [
                'order_id' => $order->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get vendor matches',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Assign vendor to order
     */
    public function assignVendor(Request $request, Order $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_id' => 'required|integer|exists:vendors,id',
                'assignment_type' => 'required|string|in:direct,sourcing,negotiation',
                'estimated_price' => 'nullable|numeric|min:0',
                'estimated_lead_time' => 'nullable|integer|min:1',
                'notes' => 'nullable|string|max:1000',
                'start_negotiation' => 'nullable|boolean',
            ]);

            $vendor = Vendor::findOrFail($validated['vendor_id']);

            // Check if vendor already assigned
            $existingAssignment = VendorOrder::where('order_id', $order->id)
                ->where('vendor_id', $vendor->id)
                ->whereIn('status', ['pending', 'accepted', 'in_progress'])
                ->first();

            if ($existingAssignment) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vendor already assigned to this order',
                    'data' => [
                        'existing_assignment' => [
                            'id' => $existingAssignment->id,
                            'status' => $existingAssignment->status,
                            'assigned_at' => $existingAssignment->created_at->toIso8601String(),
                        ]
                    ]
                ], 409);
            }

            // Create vendor assignment
            $vendorOrder = VendorOrder::create([
                'tenant_id' => $order->tenant_id,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'assignment_type' => $validated['assignment_type'],
                'status' => 'pending',
                'estimated_price' => $validated['estimated_price'] ?? null,
                'estimated_lead_time_days' => $validated['estimated_lead_time'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'assigned_at' => now(),
            ]);

            // Update order with primary vendor
            $order->update([
                'vendor_id' => $vendor->id,
                'status' => 'vendor_assigned'
            ]);

            // Start negotiation if requested
            $negotiation = null;
            if ($validated['start_negotiation'] ?? false) {
                $negotiation = $this->vendorMatchingService->startNegotiation($order, $vendor, [
                    'initial_offer' => $validated['estimated_price'] ?? $order->total_amount,
                    'notes' => $validated['notes'] ?? 'Initial vendor assignment',
                ]);
            }

            return response()->json([
                'success' => true,
                'message' => 'Vendor assigned successfully',
                'data' => [
                    'vendor_order' => [
                        'id' => $vendorOrder->id,
                        'uuid' => $vendorOrder->uuid,
                        'assignment_type' => $vendorOrder->assignment_type,
                        'status' => $vendorOrder->status,
                        'estimated_price' => $vendorOrder->estimated_price,
                        'estimated_lead_time_days' => $vendorOrder->estimated_lead_time_days,
                        'assigned_at' => $vendorOrder->assigned_at->toIso8601String(),
                    ],
                    'vendor' => [
                        'id' => $vendor->id,
                        'uuid' => $vendor->uuid,
                        'name' => $vendor->name,
                        'code' => $vendor->code,
                        'quality_tier' => $vendor->quality_tier,
                        'contact_person' => $vendor->contact_person,
                        'email' => $vendor->email,
                        'phone' => $vendor->phone,
                    ],
                    'negotiation' => $negotiation ? [
                        'id' => $negotiation->id,
                        'uuid' => $negotiation->uuid,
                        'status' => $negotiation->status,
                        'initial_offer' => $negotiation->initial_offer,
                        'round' => $negotiation->round,
                    ] : null,
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to assign vendor', [
                'order_id' => $order->id ?? null,
                'vendor_id' => $validated['vendor_id'] ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to assign vendor',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }
}