<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Spatie\Multitenancy\Models\Tenant as BaseTenant;

class QuoteController extends Controller
{
    /**
     * Check if an active quote exists for the given order and vendor.
     */
    public function checkExisting(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string|uuid',
            'vendor_id' => 'sometimes|string|uuid',
            'status' => 'sometimes|array',
            'status.*' => 'sometimes|in:open,countered,accepted,rejected,cancelled,expired',
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        
        \Log::info('[QuoteController::checkExisting] Request params', [
            'order_id' => $request->input('order_id'),
            'vendor_id' => $request->input('vendor_id'),
            'status' => $request->input('status'),
            'tenant_id' => $tenantId,
        ]);
        
        // Convert order UUID to internal ID
        $order = Order::where('tenant_id', $tenantId)
            ->where('uuid', $request->input('order_id'))
            ->firstOrFail();

        \Log::info('[QuoteController::checkExisting] Order found', [
            'order_id' => $order->id,
            'order_uuid' => $order->uuid,
            'order_number' => $order->order_number,
        ]);

        $query = OrderVendorNegotiation::with(['order.customer', 'vendor'])
            ->where('tenant_id', $tenantId)
            ->where('order_id', $order->id);

        // Filter by vendor if provided
        if ($request->filled('vendor_id')) {
            $vendor = Vendor::where('tenant_id', $tenantId)
                ->where('uuid', $request->input('vendor_id'))
                ->firstOrFail();
            $query->where('vendor_id', $vendor->id);
            
            \Log::info('[QuoteController::checkExisting] Filtering by vendor', [
                'vendor_id' => $vendor->id,
                'vendor_uuid' => $vendor->uuid,
            ]);
        }

        // Filter by status (default: active statuses)
        // Note: 'draft' and 'sent' are not valid statuses in the database enum
        // Map them to valid statuses or filter them out
        $requestedStatuses = $request->input('status', ['open', 'countered']);
        $validStatuses = ['open', 'countered', 'accepted', 'rejected', 'cancelled', 'expired'];
        
        // Filter out invalid statuses (like 'draft' and 'sent')
        $statuses = array_intersect($requestedStatuses, $validStatuses);
        
        // If no valid statuses remain, use default active statuses
        if (empty($statuses)) {
            $statuses = ['open', 'countered'];
        }
        
        \Log::info('[QuoteController::checkExisting] Status filter', [
            'requested' => $requestedStatuses,
            'valid' => $statuses,
        ]);
        
        $query->whereIn('status', $statuses);

        // Get the first matching quote
        $quote = $query->orderBy('created_at', 'desc')->first();

        \Log::info('[QuoteController::checkExisting] Query result', [
            'found_quote' => $quote !== null,
            'quote_id' => $quote?->id,
            'quote_uuid' => $quote?->uuid,
            'quote_status' => $quote?->status,
        ]);

        $hasActiveQuote = $quote !== null;

        return response()->json([
            'data' => [
                'has_active_quote' => $hasActiveQuote,
                'quote' => $hasActiveQuote ? $this->transformQuoteToFrontend($quote) : null,
            ]
        ]);
    }

    /**
     * Display a listing of quotes (vendor negotiations).
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);
        
        $tenantId = $this->getCurrentTenantId($request);
        $query = OrderVendorNegotiation::with(['order.customer', 'vendor'])
            ->where('tenant_id', $tenantId);
            
        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        
        if ($request->filled('vendor_id')) {
            $query->where('vendor_id', $request->input('vendor_id'));
        }
        
        if ($request->filled('order_id')) {
            $query->where('order_id', $request->input('order_id'));
        }
        
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->whereHas('order', function (Builder $q) use ($search) {
                $q->where('order_number', 'LIKE', "%{$search}%");
            })
            ->orWhereHas('vendor', function (Builder $q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%");
            });
        }
        
        // Date range filters
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        
        // Sorting
        $sortField = $request->input('sort', 'created_at');
        $sortDirection = $request->input('direction', 'desc');
        $query->orderBy($sortField, $sortDirection);
        
        $quotes = $query->paginate($perPage, ['*'], 'page', $page);
        
        return response()->json([
            'data' => collect($quotes->items())->map(function ($quote) {
                return $this->transformQuoteToFrontend($quote);
            })->toArray(),
            'meta' => [
                'current_page' => $quotes->currentPage(),
                'per_page' => $quotes->perPage(),
                'total' => $quotes->total(),
                'last_page' => $quotes->lastPage(),
                'from' => $quotes->firstItem(),
                'to' => $quotes->lastItem()
            ]
        ]);
    }

    /**
     * Display the specified quote.
     */
    public function show(Request $request, string $id)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::with(['order.customer', 'vendor'])
            ->where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->firstOrFail();

        return response()->json([
            'data' => $this->transformQuoteToFrontend($quote)
        ]);
    }

    /**
     * Store a newly created quote.
     */
    public function store(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string|uuid',
            'vendor_id' => 'required|string|uuid',
            'initial_offer' => 'required|numeric|min:0',
            'currency' => 'sometimes|string|size:3',
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'terms_and_conditions' => 'sometimes|string',
            'notes' => 'sometimes|string',
            'items' => 'sometimes|array',
            'items.*.product_id' => 'sometimes|string',
            'items.*.description' => 'sometimes|string',
            'items.*.quantity' => 'sometimes|numeric|min:1',
            'items.*.unit_price' => 'sometimes|numeric|min:0',
            'items.*.vendor_cost' => 'sometimes|numeric|min:0',
            'items.*.total_price' => 'sometimes|numeric|min:0',
            'items.*.specifications' => 'sometimes|array',
            'items.*.notes' => 'sometimes|string',
            'expires_at' => 'sometimes|date|after:now',
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        
        // Convert UUIDs to internal IDs
        $order = Order::where('tenant_id', $tenantId)
            ->where('uuid', $request->input('order_id'))
            ->firstOrFail();
            
        $vendor = Vendor::where('tenant_id', $tenantId)
            ->where('uuid', $request->input('vendor_id'))
            ->firstOrFail();
        
        // Build quote_details with form schema
        $items = $request->input('items', []);
        $enrichedItems = $this->enrichItemsWithFormSchema($items, $order);
        
        $quoteDetails = [
            'title' => $request->input('title'),
            'description' => $request->input('description'),
            'terms_and_conditions' => $request->input('terms_and_conditions'),
            'notes' => $request->input('notes'),
            'items' => $enrichedItems,
        ];
        
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $tenantId,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'initial_offer' => $request->input('initial_offer') * 100, // Convert to cents
            'latest_offer' => $request->input('initial_offer') * 100,
            'currency' => $request->input('currency', 'IDR'),
            'quote_details' => $quoteDetails,
            'expires_at' => $request->input('expires_at'),
            'status' => 'open',
        ]);

        $quote->load(['order.customer', 'vendor']);

        return response()->json([
            'data' => $this->transformQuoteToFrontend($quote)
        ], 201);
    }

    /**
     * Update the specified quote.
     */
    public function update(Request $request, string $id)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->firstOrFail();

        $request->validate([
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'latest_offer' => 'sometimes|numeric|min:0',
            'quote_details' => 'sometimes|array',
            'terms_and_conditions' => 'sometimes|string',
            'notes' => 'sometimes|string',
            'items' => 'sometimes|array',
            'items.*.product_id' => 'sometimes|string',
            'items.*.description' => 'sometimes|string',
            'items.*.quantity' => 'sometimes|numeric|min:1',
            'items.*.unit_price' => 'sometimes|numeric|min:0',
            'items.*.vendor_cost' => 'sometimes|numeric|min:0',
            'items.*.total_price' => 'sometimes|numeric|min:0',
            'items.*.specifications' => 'sometimes|array',
            'items.*.notes' => 'sometimes|string',
            'expires_at' => 'sometimes|date|after:now',
            'valid_until' => 'sometimes|date|after:now',
            'status' => 'sometimes|in:open,countered,accepted,rejected,cancelled,expired',
        ]);

        $updateData = [];
        
        // Build quote_details JSON with quote details
        $quoteDetails = $quote->quote_details ?? [];
        
        if ($request->filled('title')) {
            $quoteDetails['title'] = $request->input('title');
        }
        
        if ($request->filled('description')) {
            $quoteDetails['description'] = $request->input('description');
        }
        
        if ($request->filled('terms_and_conditions')) {
            $quoteDetails['terms_and_conditions'] = $request->input('terms_and_conditions');
        }
        
        if ($request->filled('notes')) {
            $quoteDetails['notes'] = $request->input('notes');
        }
        
        if ($request->filled('items')) {
            // Preserve form_schema when updating items
            $newItems = $request->input('items');
            $existingItems = $quoteDetails['items'] ?? [];
            
            $updatedItems = [];
            foreach ($newItems as $index => $newItem) {
                // Check if there's an existing item with form_schema
                $existingItem = $existingItems[$index] ?? null;
                $formSchema = null;
                
                // Try to preserve form_schema from existing item
                if ($existingItem && isset($existingItem['form_schema'])) {
                    $formSchema = $existingItem['form_schema'];
                }
                
                // If no existing form_schema and product_id is provided, fetch it
                if (!$formSchema && isset($newItem['product_id'])) {
                    $productIdentifier = $newItem['product_id'];
                    
                    // Try to find product by UUID first, then by integer ID
                    // This handles both UUID strings and integer IDs from frontend
                    $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::where('tenant_id', $tenantId)
                        ->where(function($query) use ($productIdentifier) {
                            // If it's a valid UUID format, search by UUID
                            if (is_string($productIdentifier) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $productIdentifier)) {
                                $query->where('uuid', $productIdentifier);
                            } else {
                                // Otherwise, search by integer ID
                                $query->where('id', (int)$productIdentifier);
                            }
                        })
                        ->first();
                    
                    if ($product) {
                        $formConfig = \App\Models\ProductFormConfiguration::where('product_id', $product->id)
                            ->where('tenant_id', $tenantId)
                            ->where('is_active', true)
                            ->first();
                        
                        if ($formConfig) {
                            $formSchema = $formConfig->form_schema;
                        }
                    }
                }
                
                // Merge form_schema into the updated item
                $updatedItems[] = array_merge($newItem, [
                    'form_schema' => $formSchema,
                ]);
            }
            
            $quoteDetails['items'] = $updatedItems;
        }
        
        // Update quote_details if any quote details were provided
        if (!empty($quoteDetails)) {
            $updateData['quote_details'] = $quoteDetails;
        }
        
        if ($request->filled('latest_offer')) {
            $updateData['latest_offer'] = $request->input('latest_offer') * 100;
        }
        
        if ($request->filled('expires_at')) {
            $updateData['expires_at'] = $request->input('expires_at');
        } elseif ($request->filled('valid_until')) {
            $updateData['expires_at'] = $request->input('valid_until');
        }
        
        if ($request->filled('status')) {
            $updateData['status'] = $request->input('status');
            
            if (in_array($request->input('status'), ['accepted', 'rejected', 'cancelled', 'expired'])) {
                $updateData['closed_at'] = now();
            }
        }

        $quote->update($updateData);
        $quote->load(['order.customer', 'vendor']);

        return response()->json([
            'data' => $this->transformQuoteToFrontend($quote)
        ]);
    }

    /**
     * Accept the specified quote.
     */
    public function accept(Request $request, string $id)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate quote can be accepted
        if ($quote->status === 'accepted') {
            return response()->json([
                'message' => 'Quote has already been accepted'
            ], 422);
        }

        if ($quote->status === 'expired') {
            return response()->json([
                'message' => 'Cannot accept expired quote'
            ], 422);
        }

        // Check if quote has expired based on expires_at timestamp
        if ($quote->expires_at && $quote->expires_at < now()) {
            return response()->json([
                'message' => 'Quote has expired'
            ], 422);
        }

        // Validate quote status is acceptable for acceptance
        if (!in_array($quote->status, ['open', 'countered', 'sent'])) {
            return response()->json([
                'message' => 'Quote cannot be accepted in current status: ' . $quote->status
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Add acceptance to history
            $history = $quote->history ?? [];
            $history[] = [
                'action' => 'accepted',
                'timestamp' => now()->toISOString(),
                'user_id' => auth()->id(),
                'notes' => 'Quote accepted by admin',
            ];

            // Update quote status to accepted
            $quote->update([
                'status' => 'accepted',
                'closed_at' => now(),
                'history' => $history,
            ]);

            // Reject all other open quotes for the same order
            $rejectedCount = OrderVendorNegotiation::where('tenant_id', $tenantId)
                ->where('order_id', $quote->order_id)
                ->where('id', '!=', $quote->id)
                ->whereIn('status', ['open', 'countered', 'sent', 'draft'])
                ->update([
                    'status' => 'rejected',
                    'closed_at' => now(),
                ]);

            // Update order with quote data and advance status
            $order = $quote->order;
            if ($order) {
                // Sync vendor pricing and terms
                $order->vendor_quoted_price = $quote->latest_offer;
                $order->vendor_id = $quote->vendor_id;
                $order->vendor_terms = $quote->quote_details; // Sync vendor terms from quote
                
                // Calculate quotation amount (30% markup + 5% operational cost = 1.35 multiplier)
                $order->quotation_amount = (int) ($quote->latest_offer * 1.35);
                
                // Advance order status to customer_quote
                $order->status = 'customer_quote';
                $order->save();

                // Create order history entry
                DB::table('order_status_histories')->insert([
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'previous_status' => 'vendor_negotiation',
                    'new_status' => 'customer_quote',
                    'changed_by' => auth()->id(),
                    'changed_by_name' => auth()->user()->name ?? 'System',
                    'notes' => "Quote {$quote->uuid} accepted. Vendor: {$quote->vendor->name}",
                    'changed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'order' => [
                    'id' => $order->uuid,
                    'status' => $order->status,
                    'vendor_quoted_price' => $order->vendor_quoted_price / 100, // Convert to dollars
                    'quotation_amount' => $order->quotation_amount / 100,
                ],
                'rejected_quotes_count' => $rejectedCount,
                'message' => 'Quote accepted and order data synchronized'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Reject the specified quote.
     */
    public function reject(Request $request, string $id)
    {
        $request->validate([
            'reason' => 'required|string|min:10|max:1000'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order'])
            ->firstOrFail();

        DB::beginTransaction();
        try {
            // Add rejection reason to history
            $history = $quote->history ?? [];
            $history[] = [
                'action' => 'rejected',
                'reason' => $request->input('reason'),
                'timestamp' => now()->toISOString(),
                'user_id' => auth()->id(),
            ];

            $quote->update([
                'status' => 'rejected',
                'closed_at' => now(),
                'history' => $history,
            ]);

            // Check if all quotes for this order are now rejected
            $activeQuotesCount = OrderVendorNegotiation::where('tenant_id', $tenantId)
                ->where('order_id', $quote->order_id)
                ->whereIn('status', ['open', 'countered', 'sent', 'draft'])
                ->count();

            $allQuotesRejected = ($activeQuotesCount === 0);
            $orderStatus = null;

            // If all quotes rejected, revert order status to vendor_sourcing
            if ($allQuotesRejected && $quote->order) {
                $order = $quote->order;
                $previousStatus = $order->status;
                $order->status = 'vendor_sourcing';
                $order->save();
                $orderStatus = 'vendor_sourcing';

                // Create order history entry
                DB::table('order_status_histories')->insert([
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'previous_status' => $previousStatus,
                    'new_status' => 'vendor_sourcing',
                    'changed_by' => auth()->id(),
                    'changed_by_name' => auth()->user()->name ?? 'System',
                    'notes' => 'All vendor quotes rejected. Please select a new vendor.',
                    'changed_at' => now(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            $message = $allQuotesRejected 
                ? 'Quote rejected. All quotes for this order have been rejected. Please select a new vendor.'
                : 'Quote rejected successfully';

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'all_quotes_rejected' => $allQuotesRejected,
                'order_status' => $orderStatus,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Create a counter quote.
     */
    public function counter(Request $request, string $id)
    {
        $request->validate([
            'quoted_price' => 'required|numeric|min:0',
            'notes' => 'sometimes|string|max:1000'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->firstOrFail();

        // Add counter offer to history
        $history = $quote->history ?? [];
        $history[] = [
            'action' => 'counter_offered',
            'previous_offer' => $quote->latest_offer,
            'new_offer' => $request->input('quoted_price') * 100,
            'notes' => $request->input('notes'),
            'timestamp' => now()->toISOString(),
            'user_id' => auth()->id(),
        ];

        $quote->update([
            'latest_offer' => $request->input('quoted_price') * 100,
            'status' => 'countered',
            'round' => $quote->round + 1,
            'history' => $history,
        ]);

        $quote->load(['order.customer', 'vendor']);

        return response()->json([
            'data' => $this->transformQuoteToFrontend($quote)
        ]);
    }

    /**
     * Remove the specified quote.
     */
    public function destroy(Request $request, string $id)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->firstOrFail();

        $quote->delete();

        return response()->json(null, 204);
    }

    /**
     * Get statistics for quotes.
     */
    public function statistics(Request $request)
    {
        $tenantId = $this->getCurrentTenantId($request);
        
        $stats = [
            'total_quotes' => OrderVendorNegotiation::where('tenant_id', $tenantId)->count(),
            'open_quotes' => OrderVendorNegotiation::where('tenant_id', $tenantId)->where('status', 'open')->count(),
            'accepted_quotes' => OrderVendorNegotiation::where('tenant_id', $tenantId)->where('status', 'accepted')->count(),
            'rejected_quotes' => OrderVendorNegotiation::where('tenant_id', $tenantId)->where('status', 'rejected')->count(),
            'total_value' => OrderVendorNegotiation::where('tenant_id', $tenantId)->sum('latest_offer'),
            'average_value' => OrderVendorNegotiation::where('tenant_id', $tenantId)->avg('latest_offer'),
        ];

        return response()->json([
            'data' => $stats
        ]);
    }

    /**
     * Export quotes to CSV.
     */
    public function export(Request $request)
    {
        // For now, return a basic response
        // In a real implementation, you would generate and return a CSV file
        return response()->json([
            'message' => 'Export functionality not yet implemented'
        ], 501);
    }

    /**
     * Generate PDF for a quote.
     */
    public function pdf(string $id)
    {
        // For now, return a basic response
        // In a real implementation, you would generate and return a PDF
        return response()->json([
            'message' => 'PDF generation not yet implemented'
        ], 501);
    }

    /**
     * Enrich quote items with form schema from product configurations.
     * 
     * This method fetches the dynamic form schema for each product in the quote
     * and merges it with the item data. The form schema contains field definitions
     * (labels, types, options) that were used when the customer placed the order.
     * 
     * The enrichment process:
     * 1. Looks up the product by UUID
     * 2. Fetches the active ProductFormConfiguration for that product
     * 3. Extracts the form_schema JSON
     * 4. Merges it into the item data
     * 
     * This allows the frontend to display proper field labels and understand
     * the structure of the specifications data.
     * 
     * @param array $items Quote items to enrich (from request input)
     * @param Order $order Order associated with the quote (for tenant scoping)
     * @return array Enriched items with form_schema added to each item
     * 
     * @example
     * Input item:
     * [
     *   'product_id' => 'uuid-123',
     *   'quantity' => 2,
     *   'specifications' => ['jenis_plakat' => 'Plakat Logam']
     * ]
     * 
     * Output item:
     * [
     *   'product_id' => 'uuid-123',
     *   'quantity' => 2,
     *   'specifications' => ['jenis_plakat' => 'Plakat Logam'],
     *   'form_schema' => [
     *     'fields' => [
     *       ['name' => 'jenis_plakat', 'label' => 'Jenis Plakat', 'type' => 'select']
     *     ]
     *   ]
     * ]
     */
    private function enrichItemsWithFormSchema(array $items, Order $order): array
    {
        $enrichedItems = [];
        
        foreach ($items as $item) {
            $productUuid = $item['product_id'] ?? null;
            
            // Get form schema from product_form_configurations
            $formSchema = null;
            if ($productUuid) {
                // Fetch product by UUID
                $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::where('uuid', $productUuid)
                    ->where('tenant_id', $order->tenant_id)
                    ->first();
                
                if ($product) {
                    // Fetch ProductFormConfiguration by product_id
                    $formConfig = \App\Models\ProductFormConfiguration::where('product_id', $product->id)
                        ->where('tenant_id', $order->tenant_id)
                        ->where('is_active', true)
                        ->first();
                    
                    if ($formConfig) {
                        // Extract form_schema from configuration
                        $formSchema = $formConfig->form_schema;
                    }
                }
            }
            
            // Merge form_schema into item data
            $enrichedItems[] = array_merge($item, [
                'form_schema' => $formSchema,
            ]);
        }
        
        return $enrichedItems;
    }

    /**
     * Transform backend OrderVendorNegotiation to frontend-expected format.
     * 
     * This method converts the database model into a comprehensive API response
     * that includes:
     * - Basic quote information (ID, status, dates)
     * - Customer and vendor details
     * - Monetary calculations (prices, profit margins, currency conversions)
     * - Enhanced quote items with specifications and calculations
     * - Metadata (history, round number)
     * 
     * Key transformations:
     * 1. Extracts data from quote_details JSON field
     * 2. Calculates per-piece and total pricing for each item
     * 3. Computes profit margins (amount and percentage)
     * 4. Converts monetary values from cents to dollars
     * 5. Performs IDR to USD currency conversion
     * 6. Adds calculated fields for frontend display
     * 
     * Calculation formulas:
     * - Total Vendor Cost = Vendor Cost × Quantity
     * - Total Unit Price = Unit Price × Quantity
     * - Profit Per Piece = Unit Price - Vendor Cost
     * - Profit % = (Profit / Vendor Cost) × 100
     * - Quotation Amount = Latest Offer × 1.35 (30% markup + 5% operational)
     * 
     * @param OrderVendorNegotiation $negotiation The quote to transform
     * @return array Transformed quote data ready for API response
     */
    private function transformQuoteToFrontend(OrderVendorNegotiation $negotiation): array
    {
        $customer = $negotiation->order->customer ?? null;
        $vendor = $negotiation->vendor ?? null;
        $order = $negotiation->order;
        
        // Get exchange rate (default to 15750 if not set)
        $exchangeRate = (float) config('app.default_exchange_rate', 15750);
        
        // Extract quote details from quote_details JSON (renamed from terms)
        $quoteDetails = $negotiation->quote_details ?? [];
        $title = $quoteDetails['title'] ?? null;
        $description = $quoteDetails['description'] ?? null;
        $termsAndConditions = $quoteDetails['terms_and_conditions'] ?? null;
        $notes = $quoteDetails['notes'] ?? null;
        $quoteItems = $quoteDetails['items'] ?? [];
        
        // Transform quote items with enhanced calculations
        $transformedItems = [];
        if (!empty($quoteItems) && is_array($quoteItems)) {
            foreach ($quoteItems as $item) {
                $quantity = $item['quantity'] ?? 1;
                $unitPrice = $item['unit_price'] ?? 0;
                $vendorCost = $item['vendor_cost'] ?? 0;
                
                // Calculate totals
                $totalVendorCost = $vendorCost * $quantity;
                $totalUnitPrice = $unitPrice * $quantity;
                
                // Calculate profit margins
                $profitPerPiece = $unitPrice - $vendorCost;
                $profitPerPiecePercent = $vendorCost > 0 
                    ? ($profitPerPiece / $vendorCost) * 100 
                    : 0;
                
                $profitTotal = $totalUnitPrice - $totalVendorCost;
                $profitTotalPercent = $totalVendorCost > 0 
                    ? ($profitTotal / $totalVendorCost) * 100 
                    : 0;
                
                $transformedItems[] = [
                    'id' => $item['id'] ?? null,
                    'product_id' => $item['product_id'] ?? null,
                    'description' => $item['description'] ?? '',
                    'quantity' => $quantity,
                    
                    // Per-piece values
                    'unit_price' => $unitPrice,
                    'vendor_cost' => $vendorCost,
                    
                    // Total values (calculated)
                    'total_vendor_cost' => $totalVendorCost,
                    'total_unit_price' => $totalUnitPrice,
                    'total_price' => $totalUnitPrice, // Alias for compatibility
                    
                    // Profit margins
                    'profit_per_piece' => $profitPerPiece,
                    'profit_per_piece_percent' => round($profitPerPiecePercent, 2),
                    'profit_total' => $profitTotal,
                    'profit_total_percent' => round($profitTotalPercent, 2),
                    
                    // Dynamic form data
                    'specifications' => $item['specifications'] ?? [],
                    'form_schema' => $item['form_schema'] ?? null,
                    
                    'notes' => $item['notes'] ?? null,
                    'product' => isset($item['product_id']) ? [
                        'id' => $item['product_id'],
                        'name' => $item['description'] ?? '',
                        'sku' => $item['product_sku'] ?? null,
                        'unit' => $item['unit'] ?? 'pcs',
                    ] : null,
                ];
            }
        } elseif ($order && !empty($order->items) && is_array($order->items)) {
            // Fallback to order items if quote items not set
            $transformedItems = $order->items;
        }
        
        // Calculate items count
        $itemsCount = count($transformedItems);
        
        // Calculate profit margin based on quote's latest_offer
        // Profit margin = (quotation_amount - vendor_quoted_price)
        // For quotes: quotation_amount = latest_offer × 1.35 (30% markup + 5% operational cost)
        $latestOfferIDR = $negotiation->latest_offer ?? 0; // in cents (vendor cost)
        $quotationAmountIDR = (int) ($latestOfferIDR * 1.35); // in cents (customer price)
        $profitMarginIDR = $quotationAmountIDR - $latestOfferIDR; // in cents
        $profitMarginPercentage = $latestOfferIDR > 0 
            ? (($profitMarginIDR / $latestOfferIDR) * 100) 
            : 0;
        
        // Convert monetary values to USD
        $initialOfferIDR = $negotiation->initial_offer ?? 0; // in cents
        $latestOfferUSD = $latestOfferIDR / $exchangeRate; // cents / rate = USD cents
        $initialOfferUSD = $initialOfferIDR / $exchangeRate;
        $quotationAmountUSD = $quotationAmountIDR / $exchangeRate;
        $profitMarginUSD = $profitMarginIDR / $exchangeRate;
        
        return [
            'id' => $negotiation->uuid,
            'quote_number' => 'Q-' . str_pad($negotiation->id, 6, '0', STR_PAD_LEFT), // Generate quote number
            'order_id' => $negotiation->order->uuid ?? null,
            'order_number' => $negotiation->order->order_number ?? null,
            
            // Quote details from terms JSON
            'title' => $title,
            'description' => $description,
            'terms_and_conditions' => $termsAndConditions,
            'notes' => $notes,
            
            'customer' => $customer ? [
                'id' => $customer->uuid,
                'name' => $customer->name,
                'email' => $customer->email,
                'company' => $customer->company ?? null,
            ] : null,
            'customer_id' => $customer->uuid ?? null,
            'vendor' => $vendor ? [
                'id' => $vendor->uuid,
                'name' => $vendor->name,
                'email' => $vendor->email ?? null,
                'company' => $vendor->company ?? null,
            ] : null,
            'vendor_id' => $vendor->uuid ?? null,
            'vendor_name' => $vendor->name ?? null,
            'status' => $negotiation->status,
            'type' => 'vendor_quote', // Default type for OrderVendorNegotiation
            
            // Monetary values in IDR (cents converted to dollars for display)
            'quoted_price' => $latestOfferIDR / 100, // IDR in dollars
            'original_price' => $initialOfferIDR / 100, // IDR in dollars
            'grand_total' => $latestOfferIDR / 100, // Alias for sorting
            
            // USD conversions
            'quoted_price_usd' => round($latestOfferUSD / 100, 2), // USD in dollars
            'original_price_usd' => round($initialOfferUSD / 100, 2), // USD in dollars
            'grand_total_usd' => round($latestOfferUSD / 100, 2), // USD in dollars
            
            // Items count from quote items or order items
            'items_count' => $itemsCount,
            
            // Profit margin calculations (based on 35% markup)
            'profit_margin' => $profitMarginIDR / 100, // IDR in dollars
            'profit_margin_usd' => round($profitMarginUSD / 100, 2), // USD in dollars
            'profit_margin_percentage' => round($profitMarginPercentage, 2),
            'quotation_amount' => $quotationAmountIDR / 100, // Customer-facing price in IDR
            'quotation_amount_usd' => round($quotationAmountUSD / 100, 2), // Customer-facing price in USD
            
            'currency' => $negotiation->currency,
            'exchange_rate' => $exchangeRate,
            'valid_until' => $negotiation->expires_at?->toISOString(),
            'terms' => $negotiation->quote_details ?? [], // Use quote_details instead of terms
            
            // Items from quote details (transformed with all fields and calculations)
            'items' => $transformedItems,
            
            // Vendor response tracking (Phase 2 preparation)
            'sent_at' => null, // Will be populated when send feature is implemented
            'vendor_viewed_at' => null, // Will be populated when vendor views quote
            'responded_at' => null, // Will be populated when vendor responds
            'vendor_response' => null, // Will contain vendor's response data
            'response_token' => null, // Will contain unique token for vendor response
            
            'metadata' => [
                'round' => $negotiation->round,
                'history' => $negotiation->history ?? [],
            ],
            'created_at' => $negotiation->created_at->toISOString(),
            'updated_at' => $negotiation->updated_at->toISOString(),
            'closed_at' => $negotiation->closed_at?->toISOString(),
        ];
    }

    /**
     * Resolve the current tenant context.
     */
    private function resolveTenant(Request $request): BaseTenant
    {
        $candidate = $request->get('current_tenant')
            ?? $request->attributes->get('tenant')
            ?? (function_exists('tenant') ? tenant() : null);

        if (! $candidate && app()->bound('tenant.current')) {
            $candidate = app('tenant.current');
        }

        if (! $candidate && app()->bound('current_tenant')) {
            $candidate = app('current_tenant');
        }

        if (! $candidate) {
            $candidate = config('multitenancy.current_tenant');
        }

        if ($candidate instanceof BaseTenant) {
            return $candidate;
        }

        throw new \RuntimeException('Tenant context tidak ditemukan');
    }

    /**
     * Get the current tenant ID.
     */
    private function getCurrentTenantId(Request $request): int
    {
        return $this->resolveTenant($request)->id;
    }
}