<?php

namespace App\Http\Controllers;

use App\Infrastructure\Persistence\Eloquent\Models\Shipment;
use App\Infrastructure\Persistence\Eloquent\Models\ShippingMethod;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Domain\Shipping\Services\ShippingService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class ShippingController extends Controller
{
    public function __construct(
        protected ShippingService $shippingService
    ) {}

    public function shippingMethods(Request $request): JsonResponse
    {
        $methods = ShippingMethod::when(
            $request->get('is_active'),
            fn($query) => $query->where('is_active', true)
        )
        ->when(
            $request->get('carrier'),
            fn($query) => $query->where('carrier', $request->get('carrier'))
        )
        ->when(
            $request->get('type'),
            fn($query) => $query->where('type', $request->get('type'))
        )
        ->ordered()
        ->paginate($request->get('limit', 20));

        return response()->json([
            'data' => $methods->items(),
            'pagination' => [
                'total' => $methods->total(),
                'per_page' => $methods->perPage(),
                'current_page' => $methods->currentPage(),
                'last_page' => $methods->lastPage(),
            ]
        ]);
    }

    public function calculateShipping(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'shipping_method_id' => 'required|exists:shipping_methods,id',
        ]);

        try {
            $order = Order::findOrFail($validated['order_id']);
            $method = ShippingMethod::findOrFail($validated['shipping_method_id']);

            $costDetails = $this->shippingService->calculateShippingCost($order, $method);

            return response()->json([
                'data' => $costDetails
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to calculate shipping cost', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to calculate shipping cost',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createShipment(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'order_id' => 'required|exists:orders,id',
            'shipping_method_id' => 'required|exists:shipping_methods,id',
            'special_instructions' => 'sometimes|string|max:500',
            'dimensions' => 'sometimes|array',
        ]);

        try {
            $order = Order::findOrFail($validated['order_id']);

            $shipment = $this->shippingService->createShipment($order, $validated);

            Log::info('Shipment created', [
                'shipment_id' => $shipment->id,
                'order_id' => $shipment->order_id,
                'created_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Shipment created successfully',
                'data' => $shipment->fresh(['order', 'shippingMethod'])
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create shipment', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to create shipment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function listShipments(Request $request): JsonResponse
    {
        $shipments = Shipment::with(['order', 'shippingMethod'])
            ->when(
                $request->get('status'),
                fn($query) => $query->where('status', $request->get('status'))
            )
            ->when(
                $request->get('order_id'),
                fn($query) => $query->where('order_id', $request->get('order_id'))
            )
            ->when(
                $request->get('tracking_number'),
                fn($query) => $query->where('tracking_number', $request->get('tracking_number'))
            )
            ->latest()
            ->paginate($request->get('limit', 20));

        return response()->json([
            'data' => $shipments->items(),
            'pagination' => [
                'total' => $shipments->total(),
                'per_page' => $shipments->perPage(),
                'current_page' => $shipments->currentPage(),
                'last_page' => $shipments->lastPage(),
            ]
        ]);
    }

    public function showShipment(Shipment $shipment): JsonResponse
    {
        return response()->json([
            'data' => $shipment->load(['order', 'shippingMethod'])
        ]);
    }

    public function processShipment(Request $request, Shipment $shipment): JsonResponse
    {
        if ($shipment->status !== 'pending') {
            return response()->json([
                'message' => 'Only pending shipments can be processed'
            ], 422);
        }

        try {
            $this->shippingService->processShipment($shipment);

            Log::info('Shipment processed', [
                'shipment_id' => $shipment->id,
                'tracking_number' => $shipment->tracking_number,
                'processed_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Shipment processed successfully',
                'data' => $shipment->fresh(['order', 'shippingMethod'])
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to process shipment', [
                'shipment_id' => $shipment->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to process shipment',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function updateTracking(Request $request, Shipment $shipment): JsonResponse
    {
        try {
            $trackingEvents = $this->shippingService->updateTracking($shipment);

            Log::info('Tracking updated', [
                'shipment_id' => $shipment->id,
                'status' => $shipment->status,
                'updated_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Tracking updated successfully',
                'data' => [
                    'shipment' => $shipment->fresh(['order', 'shippingMethod']),
                    'tracking_events' => $trackingEvents
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update tracking', [
                'shipment_id' => $shipment->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to update tracking',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function cancelShipment(Request $request, Shipment $shipment): JsonResponse
    {
        $validated = $request->validate([
            'reason' => 'sometimes|string|max:500',
        ]);

        try {
            $this->shippingService->cancelShipment(
                $shipment,
                $validated['reason'] ?? null
            );

            Log::info('Shipment cancelled', [
                'shipment_id' => $shipment->id,
                'cancelled_by' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Shipment cancelled successfully',
                'data' => $shipment->fresh(['order', 'shippingMethod'])
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to cancel shipment', [
                'shipment_id' => $shipment->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Failed to cancel shipment',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
