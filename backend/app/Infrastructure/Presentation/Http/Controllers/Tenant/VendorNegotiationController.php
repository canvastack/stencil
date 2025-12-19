<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Domain\Order\Services\VendorNegotiationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class VendorNegotiationController extends Controller
{
    public function __construct(
        private VendorNegotiationService $negotiationService
    ) {}

    /**
     * Get all vendor negotiations
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'nullable|string|in:open,countered,approved,rejected,expired',
                'order_id' => 'nullable|integer|exists:orders,id',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'sort_by' => 'nullable|string|in:created_at,updated_at,status,round',
                'sort_order' => 'nullable|string|in:asc,desc',
            ]);

            $query = OrderVendorNegotiation::with(['order', 'vendor']);

            // Apply filters
            if (!empty($validated['status'])) {
                $query->where('status', $validated['status']);
            }

            if (!empty($validated['order_id'])) {
                $query->where('order_id', $validated['order_id']);
            }

            if (!empty($validated['vendor_id'])) {
                $query->where('vendor_id', $validated['vendor_id']);
            }

            // Apply sorting
            $sortBy = $validated['sort_by'] ?? 'created_at';
            $sortOrder = $validated['sort_order'] ?? 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $validated['per_page'] ?? 20;
            $negotiations = $query->paginate($perPage);

            // Transform data
            $transformedData = $negotiations->getCollection()->map(function ($negotiation) {
                return [
                    'id' => $negotiation->id,
                    'uuid' => $negotiation->uuid,
                    'order_id' => $negotiation->order_id,
                    'order_number' => $negotiation->order->order_number ?? null,
                    'vendor_id' => $negotiation->vendor_id,
                    'vendor_name' => $negotiation->vendor->name ?? 'Unknown Vendor',
                    'vendor_code' => $negotiation->vendor->code ?? null,
                    'status' => $negotiation->status,
                    'initial_offer' => $negotiation->initial_offer,
                    'latest_offer' => $negotiation->latest_offer,
                    'currency' => $negotiation->currency,
                    'round' => $negotiation->round,
                    'terms' => $negotiation->terms,
                    'history' => $negotiation->history,
                    'expires_at' => $negotiation->expires_at?->toIso8601String(),
                    'closed_at' => $negotiation->closed_at?->toIso8601String(),
                    'created_at' => $negotiation->created_at->toIso8601String(),
                    'updated_at' => $negotiation->updated_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Vendor negotiations retrieved successfully',
                'data' => $transformedData,
                'meta' => [
                    'current_page' => $negotiations->currentPage(),
                    'per_page' => $negotiations->perPage(),
                    'total' => $negotiations->total(),
                    'last_page' => $negotiations->lastPage(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to fetch vendor negotiations', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendor negotiations',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Start negotiation for an order
     */
    public function start(Request $request, Order $order): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_id' => 'required|integer|exists:vendors,id',
                'initial_offer' => 'nullable|numeric|min:0',
                'currency' => 'nullable|string|in:IDR,USD,EUR',
                'terms' => 'nullable|array',
                'notes' => 'nullable|string|max:1000',
                'expires_at' => 'nullable|date|after:now',
            ]);

            $negotiation = $this->negotiationService->startNegotiation($order, [
                'vendor_id' => $validated['vendor_id'],
                'initial_offer' => $validated['initial_offer'] ?? $order->total_amount,
                'currency' => $validated['currency'] ?? $order->currency ?? 'IDR',
                'terms' => $validated['terms'] ?? [],
                'notes' => $validated['notes'] ?? null,
                'expires_at' => $validated['expires_at'] ?? now()->addDays(7),
                'initiator' => 'customer',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Vendor negotiation started successfully',
                'data' => [
                    'id' => $negotiation->id,
                    'uuid' => $negotiation->uuid,
                    'order_id' => $negotiation->order_id,
                    'vendor_id' => $negotiation->vendor_id,
                    'vendor_name' => $negotiation->vendor->name ?? null,
                    'status' => $negotiation->status,
                    'initial_offer' => $negotiation->initial_offer,
                    'latest_offer' => $negotiation->latest_offer,
                    'currency' => $negotiation->currency,
                    'round' => $negotiation->round,
                    'terms' => $negotiation->terms,
                    'expires_at' => $negotiation->expires_at?->toIso8601String(),
                    'created_at' => $negotiation->created_at->toIso8601String(),
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to start vendor negotiation', [
                'order_id' => $order->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to start negotiation',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Add counter offer to negotiation
     */
    public function addCounterOffer(Request $request, OrderVendorNegotiation $negotiation): JsonResponse
    {
        try {
            $validated = $request->validate([
                'amount' => 'required|numeric|min:0',
                'actor' => 'required|string|in:customer,vendor',
                'terms' => 'nullable|array',
                'notes' => 'nullable|string|max:1000',
            ]);

            $updatedNegotiation = $this->negotiationService->recordCounterOffer($negotiation, [
                'amount' => $validated['amount'],
                'actor' => $validated['actor'],
                'terms' => $validated['terms'] ?? [],
                'notes' => $validated['notes'] ?? null,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Counter offer added successfully',
                'data' => [
                    'id' => $updatedNegotiation->id,
                    'uuid' => $updatedNegotiation->uuid,
                    'status' => $updatedNegotiation->status,
                    'latest_offer' => $updatedNegotiation->latest_offer,
                    'round' => $updatedNegotiation->round,
                    'history' => $updatedNegotiation->history,
                    'updated_at' => $updatedNegotiation->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to add counter offer', [
                'negotiation_id' => $negotiation->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to add counter offer',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Approve negotiation
     */
    public function approve(Request $request, OrderVendorNegotiation $negotiation): JsonResponse
    {
        try {
            $validated = $request->validate([
                'final_terms' => 'nullable|array',
                'notes' => 'nullable|string|max:1000',
            ]);

            $approvedNegotiation = $this->negotiationService->approveNegotiation($negotiation, [
                'final_terms' => $validated['final_terms'] ?? [],
                'notes' => $validated['notes'] ?? null,
                'approved_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Negotiation approved successfully',
                'data' => [
                    'id' => $approvedNegotiation->id,
                    'uuid' => $approvedNegotiation->uuid,
                    'status' => $approvedNegotiation->status,
                    'latest_offer' => $approvedNegotiation->latest_offer,
                    'closed_at' => $approvedNegotiation->closed_at?->toIso8601String(),
                    'updated_at' => $approvedNegotiation->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to approve negotiation', [
                'negotiation_id' => $negotiation->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve negotiation',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Reject negotiation
     */
    public function reject(Request $request, OrderVendorNegotiation $negotiation): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'nullable|string|max:1000',
            ]);

            $rejectedNegotiation = $this->negotiationService->rejectNegotiation($negotiation, [
                'reason' => $validated['reason'] ?? null,
                'rejected_by' => auth()->id(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Negotiation rejected successfully',
                'data' => [
                    'id' => $rejectedNegotiation->id,
                    'uuid' => $rejectedNegotiation->uuid,
                    'status' => $rejectedNegotiation->status,
                    'closed_at' => $rejectedNegotiation->closed_at?->toIso8601String(),
                    'updated_at' => $rejectedNegotiation->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to reject negotiation', [
                'negotiation_id' => $negotiation->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject negotiation',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Show single negotiation
     */
    public function show(OrderVendorNegotiation $negotiation): JsonResponse
    {
        try {
            $negotiation->load(['order', 'vendor']);

            return response()->json([
                'success' => true,
                'message' => 'Negotiation details retrieved successfully',
                'data' => [
                    'id' => $negotiation->id,
                    'uuid' => $negotiation->uuid,
                    'order' => [
                        'id' => $negotiation->order->id,
                        'order_number' => $negotiation->order->order_number,
                        'total_amount' => $negotiation->order->total_amount,
                        'currency' => $negotiation->order->currency,
                        'status' => $negotiation->order->status,
                    ],
                    'vendor' => [
                        'id' => $negotiation->vendor->id,
                        'uuid' => $negotiation->vendor->uuid,
                        'name' => $negotiation->vendor->name,
                        'code' => $negotiation->vendor->code,
                        'email' => $negotiation->vendor->email,
                        'phone' => $negotiation->vendor->phone,
                        'quality_tier' => $negotiation->vendor->quality_tier,
                    ],
                    'status' => $negotiation->status,
                    'initial_offer' => $negotiation->initial_offer,
                    'latest_offer' => $negotiation->latest_offer,
                    'currency' => $negotiation->currency,
                    'round' => $negotiation->round,
                    'terms' => $negotiation->terms,
                    'history' => $negotiation->history,
                    'expires_at' => $negotiation->expires_at?->toIso8601String(),
                    'closed_at' => $negotiation->closed_at?->toIso8601String(),
                    'created_at' => $negotiation->created_at->toIso8601String(),
                    'updated_at' => $negotiation->updated_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            Log::error('Failed to show negotiation details', [
                'negotiation_id' => $negotiation->id ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to show negotiation details',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }
}