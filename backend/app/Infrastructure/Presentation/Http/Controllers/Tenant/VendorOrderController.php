<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class VendorOrderController extends Controller
{
    /**
     * Get all orders for a specific vendor
     * Endpoint: GET /vendors/{vendorId}/orders
     */
    public function index(Request $request, string $vendorId): JsonResponse
    {
        try {
            // Verify vendor exists and belongs to tenant
            $vendor = Vendor::findOrFail((int) $vendorId);
            
            $validated = $request->validate([
                'page' => 'nullable|integer|min:1',
                'per_page' => 'nullable|integer|min:1|max:100',
                'status' => 'nullable|string|in:pending,confirmed,in_production,completed,cancelled',
                'delivery_status' => 'nullable|string|in:pending,on_time,early,late',
                'sort_by' => 'nullable|string|in:created_at,total_price,delivery_date',
                'sort_order' => 'nullable|string|in:asc,desc',
                'date_from' => 'nullable|date',
                'date_to' => 'nullable|date',
            ]);

            $perPage = $validated['per_page'] ?? 20;
            $sortBy = $validated['sort_by'] ?? 'created_at';
            $sortOrder = $validated['sort_order'] ?? 'desc';

            $query = VendorOrder::where('vendor_id', $vendor->id)
                ->with(['order', 'order.customer']);

            // Apply filters
            if (!empty($validated['status'])) {
                $query->where('status', $validated['status']);
            }

            if (!empty($validated['delivery_status'])) {
                $query->where('delivery_status', $validated['delivery_status']);
            }

            if (!empty($validated['date_from'])) {
                $query->whereHas('order', function ($q) use ($validated) {
                    $q->where('created_at', '>=', $validated['date_from']);
                });
            }

            if (!empty($validated['date_to'])) {
                $query->whereHas('order', function ($q) use ($validated) {
                    $q->where('created_at', '<=', $validated['date_to']);
                });
            }

            $vendorOrders = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);

            $ordersData = $vendorOrders->map(function ($vendorOrder) {
                $order = $vendorOrder->order;
                
                return [
                    'id' => $vendorOrder->id,
                    'uuid' => $vendorOrder->uuid ?? null,
                    'vendor_id' => $vendorOrder->vendor_id,
                    'order_id' => $vendorOrder->order_id,
                    'order_code' => $order->order_code ?? null,
                    'customer_name' => $order->customer->name ?? null,
                    'total_price' => $vendorOrder->final_price ?? $order->total_amount,
                    'vendor_price' => $vendorOrder->estimated_price ?? null,
                    'status' => $vendorOrder->status ?? 'pending',
                    'delivery_status' => $vendorOrder->delivery_status ?? 'pending',
                    'quality_rating' => $vendorOrder->quality_rating ?? null,
                    'delivery_date' => $vendorOrder->completed_at ?? null,
                    'notes' => $vendorOrder->notes ?? null,
                    'created_at' => $vendorOrder->created_at->toIso8601String(),
                    'updated_at' => $vendorOrder->updated_at->toIso8601String(),
                ];
            });

            // Calculate summary statistics
            $totalRevenue = VendorOrder::where('vendor_id', $vendor->id)
                ->where('status', 'completed')
                ->sum('final_price');

            $totalOrders = VendorOrder::where('vendor_id', $vendor->id)->count();
            
            $completedOrders = VendorOrder::where('vendor_id', $vendor->id)
                ->where('status', 'completed')
                ->count();

            $onTimeDeliveries = VendorOrder::where('vendor_id', $vendor->id)
                ->where('delivery_status', 'on_time')
                ->count();

            $averageRating = VendorOrder::where('vendor_id', $vendor->id)
                ->whereNotNull('quality_rating')
                ->avg('quality_rating');

            return response()->json([
                'success' => true,
                'message' => 'Vendor orders retrieved successfully',
                'data' => $ordersData,
                'meta' => [
                    'current_page' => $vendorOrders->currentPage(),
                    'per_page' => $vendorOrders->perPage(),
                    'total' => $vendorOrders->total(),
                    'last_page' => $vendorOrders->lastPage(),
                    'vendor_id' => $vendorId,
                    'vendor_name' => $vendor->name,
                ],
                'summary' => [
                    'total_orders' => $totalOrders,
                    'completed_orders' => $completedOrders,
                    'completion_rate' => $totalOrders > 0 ? round(($completedOrders / $totalOrders) * 100, 1) : 0,
                    'on_time_deliveries' => $onTimeDeliveries,
                    'on_time_rate' => $completedOrders > 0 ? round(($onTimeDeliveries / $completedOrders) * 100, 1) : 0,
                    'average_rating' => $averageRating ? round($averageRating, 2) : null,
                    'total_revenue' => $totalRevenue ?? 0,
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
                'message' => 'Failed to fetch vendor orders',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get a specific order for a vendor
     * Endpoint: GET /vendors/{vendorId}/orders/{orderId}
     */
    public function show(Request $request, string $vendorId, string $orderId): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail((int) $vendorId);
            
            $vendorOrder = VendorOrder::where('vendor_id', $vendor->id)
                ->where('order_id', (int) $orderId)
                ->with(['order', 'order.customer'])
                ->firstOrFail();

            $order = $vendorOrder->order;

            return response()->json([
                'success' => true,
                'message' => 'Vendor order details retrieved successfully',
                'data' => [
                    'id' => $vendorOrder->id,
                    'uuid' => $vendorOrder->uuid ?? null,
                    'vendor_id' => $vendorOrder->vendor_id,
                    'order_id' => $vendorOrder->order_id,
                    'order_code' => $order->order_code ?? null,
                    'customer' => [
                        'id' => $order->customer->id ?? null,
                        'name' => $order->customer->name ?? null,
                        'email' => $order->customer->email ?? null,
                        'phone' => $order->customer->phone ?? null,
                    ],
                    'items' => collect($order->items ?? [])->map(function ($item) {
                        $itemArray = is_array($item) ? $item : (array) $item;
                        return [
                            'id' => $itemArray['id'] ?? null,
                            'product_name' => $itemArray['name'] ?? $itemArray['product_name'] ?? null,
                            'quantity' => $itemArray['quantity'] ?? 1,
                            'price' => $itemArray['price'] ?? 0,
                            'total' => ($itemArray['quantity'] ?? 1) * ($itemArray['price'] ?? 0),
                        ];
                    }),
                    'total_price' => $vendorOrder->final_price ?? $order->total_amount,
                    'vendor_price' => $vendorOrder->estimated_price ?? null,
                    'profit_margin' => $this->calculateProfitMargin($vendorOrder),
                    'status' => $vendorOrder->status ?? 'pending',
                    'delivery_status' => $vendorOrder->delivery_status ?? 'pending',
                    'quality_rating' => $vendorOrder->quality_rating ?? null,
                    'delivery_date' => $vendorOrder->completed_at ? $vendorOrder->completed_at->toIso8601String() : null,
                    'notes' => $vendorOrder->notes ?? null,
                    'created_at' => $vendorOrder->created_at->toIso8601String(),
                    'updated_at' => $vendorOrder->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor order not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendor order details',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Calculate profit margin for vendor order
     */
    private function calculateProfitMargin($vendorOrder): ?float
    {
        if (!$vendorOrder->final_price || !$vendorOrder->estimated_price) {
            return null;
        }

        $margin = $vendorOrder->final_price - $vendorOrder->estimated_price;
        $marginPercentage = ($margin / $vendorOrder->final_price) * 100;

        return round($marginPercentage, 2);
    }
}
