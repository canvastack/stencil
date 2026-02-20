<?php

namespace App\Http\Controllers\Admin;

use App\Application\CustomerQuote\Services\CustomerQuoteService;
use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerQuoteResource;
use App\Infrastructure\Persistence\Eloquent\Models\CustomerQuote;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin Controller for Customer Quote Management
 * 
 * Handles CRUD operations for customer quotes
 */
class CustomerQuoteController extends Controller
{
    public function __construct(
        private CustomerQuoteService $quoteService
    ) {}

    /**
     * List all customer quotes
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;
            
            // Use optimized query scope for eager loading
            $query = CustomerQuote::where('tenant_id', $tenantId)
                ->withRelations(); // Use the optimized scope

            // Filter by order UUID
            if ($request->has('order_uuid')) {
                $query->whereHas('order', function ($q) use ($request) {
                    $q->where('uuid', $request->order_uuid);
                });
            }

            // Filter by status
            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            // Filter by date range
            if ($request->has('from_date')) {
                $query->where('created_at', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->where('created_at', '<=', $request->to_date);
            }

            // Search by quote number or customer
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('quote_number', 'like', "%{$search}%")
                      ->orWhereHas('order.customer', function ($q) use ($search) {
                          $q->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                      });
                });
            }

            // Sort
            $sortBy = $request->get('sort_by', 'created_at');
            $sortOrder = $request->get('sort_order', 'desc');
            $query->orderBy($sortBy, $sortOrder);

            // Paginate with configurable per_page (default 15, max 100)
            $perPage = min((int) $request->get('per_page', 15), 100);
            $quotes = $query->paginate($perPage);

            return response()->json([
                'success' => true,
                'data' => CustomerQuoteResource::collection($quotes->items()),
                'meta' => [
                    'current_page' => $quotes->currentPage(),
                    'from' => $quotes->firstItem(),
                    'last_page' => $quotes->lastPage(),
                    'per_page' => $quotes->perPage(),
                    'to' => $quotes->lastItem(),
                    'total' => $quotes->total(),
                ],
                'links' => [
                    'first' => $quotes->url(1),
                    'last' => $quotes->url($quotes->lastPage()),
                    'prev' => $quotes->previousPageUrl(),
                    'next' => $quotes->nextPageUrl(),
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to list customer quotes', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer quotes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get single customer quote
     * 
     * @param string $uuid
     * @return JsonResponse
     */
    public function show(string $uuid): JsonResponse
    {
        try {
            $quote = $this->quoteService->getByUuid($uuid);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer quote not found',
                ], 404);
            }

            // Load relationships
            $quote->load([
                'order.customer',
                'vendorQuote',
                'createdBy',
                'approvedBy',
                'rejectedBy',
                'documents',
                'paymentTransactions',
            ]);

            return response()->json([
                'success' => true,
                'data' => new CustomerQuoteResource($quote),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to retrieve customer quote', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve customer quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create customer quote from vendor quote
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|integer|exists:orders,id',
                'vendor_quote_id' => 'required|integer|exists:vendor_quotes,id',
                'title' => 'required|string|max:255',
                'profit_percentage' => 'required|numeric|min:0|max:100',
                'handling_fee' => 'nullable|integer|min:0',
                'shipping_cost' => 'nullable|integer|min:0',
                'insurance' => 'nullable|integer|min:0',
                'other_costs' => 'nullable|integer|min:0',
                'other_costs_description' => 'nullable|string',
                'tax_rate' => 'required|numeric|min:0|max:100',
                'payment_terms' => 'required|string',
                'delivery_timeline' => 'nullable|string|max:255',
                'terms_conditions' => 'nullable|string',
                'valid_until' => 'required|date|after:now',
            ]);

            $tenantId = $request->user()->tenant_id;
            $userId = $request->user()->id;

            // Prepare additional costs
            $additionalCosts = [
                'profit_percentage' => $validated['profit_percentage'],
                'handling_fee' => $validated['handling_fee'] ?? 0,
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'insurance' => $validated['insurance'] ?? 0,
                'other_costs' => $validated['other_costs'] ?? 0,
                'other_costs_description' => $validated['other_costs_description'] ?? null,
            ];

            // Prepare terms
            $terms = [
                'title' => $validated['title'],
                'tax_rate' => $validated['tax_rate'],
                'payment_terms' => $validated['payment_terms'],
                'delivery_timeline' => $validated['delivery_timeline'] ?? null,
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'valid_until' => $validated['valid_until'],
            ];

            // Create quote
            $quote = $this->quoteService->createFromVendorQuote(
                tenantId: $tenantId,
                orderId: $validated['order_id'],
                vendorQuoteId: $validated['vendor_quote_id'],
                additionalCosts: $additionalCosts,
                terms: $terms,
                createdBy: $userId
            );

            return response()->json([
                'success' => true,
                'message' => 'Customer quote created successfully',
                'data' => $quote,
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to create customer quote', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create customer quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send customer quote to customer
     * 
     * @param string $uuid
     * @param Request $request
     * @return JsonResponse
     */
    public function send(string $uuid, Request $request): JsonResponse
    {
        try {
            $userId = $request->user()->id;

            $quote = $this->quoteService->sendToCustomer($uuid, $userId);
            
            // Load relationships for resource
            $quote->load([
                'order.customer',
                'vendorQuote',
                'createdBy',
                'documents',
                'paymentTransactions',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Customer quote sent successfully',
                'data' => new CustomerQuoteResource($quote),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to send customer quote', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send customer quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update customer quote (draft only)
     * 
     * @param string $uuid
     * @param Request $request
     * @return JsonResponse
     */
    public function update(string $uuid, Request $request): JsonResponse
    {
        try {
            $quote = $this->quoteService->getByUuid($uuid);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer quote not found',
                ], 404);
            }

            if ($quote->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only draft quotes can be updated',
                ], 400);
            }

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'payment_terms' => 'sometimes|string',
                'delivery_timeline' => 'nullable|string|max:255',
                'terms_conditions' => 'nullable|string',
                'valid_until' => 'sometimes|date|after:now',
            ]);

            $quote->update($validated);
            
            // Load relationships for resource
            $quote->load([
                'order.customer',
                'vendorQuote',
                'createdBy',
                'documents',
                'paymentTransactions',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Customer quote updated successfully',
                'data' => new CustomerQuoteResource($quote),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to update customer quote', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update customer quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete customer quote (draft only)
     * 
     * @param string $uuid
     * @return JsonResponse
     */
    public function destroy(string $uuid): JsonResponse
    {
        try {
            $quote = $this->quoteService->getByUuid($uuid);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer quote not found',
                ], 404);
            }

            if ($quote->status !== 'draft') {
                return response()->json([
                    'success' => false,
                    'message' => 'Only draft quotes can be deleted',
                ], 400);
            }

            $quote->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer quote deleted successfully',
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to delete customer quote', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete customer quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get payment summary for a quote
     * 
     * @param string $uuid
     * @return JsonResponse
     */
    public function paymentSummary(string $uuid): JsonResponse
    {
        try {
            $quote = CustomerQuote::where('uuid', $uuid)->firstOrFail();
            
            $paymentTrackingService = app(\App\Application\CustomerQuote\Services\PaymentTrackingService::class);
            $summary = $paymentTrackingService->getPaymentSummary($quote);

            return response()->json([
                'success' => true,
                'data' => $summary,
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get payment summary', [
                'uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve payment summary',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
