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
            'status.*' => 'sometimes|in:draft,sent,pending_response,countered,accepted,rejected,expired',
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
        // Active statuses are: draft, sent, pending_response, countered
        $requestedStatuses = $request->input('status', ['draft', 'sent', 'pending_response', 'countered']);
        $validStatuses = ['draft', 'sent', 'pending_response', 'countered', 'accepted', 'rejected', 'expired'];
        
        // Filter out invalid statuses
        $statuses = array_intersect($requestedStatuses, $validStatuses);
        
        // If no valid statuses remain, use default active statuses
        if (empty($statuses)) {
            $statuses = ['draft', 'sent', 'pending_response', 'countered'];
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
            // Convert vendor UUID to internal ID
            $vendor = Vendor::where('tenant_id', $tenantId)
                ->where('uuid', $request->input('vendor_id'))
                ->first();
            if ($vendor) {
                $query->where('vendor_id', $vendor->id);
            }
        }
        
        if ($request->filled('order_id')) {
            $orderId = $request->input('order_id');
            
            // Support both UUID and integer ID
            if (is_numeric($orderId)) {
                // Integer ID provided
                $query->where('order_id', (int)$orderId);
            } else {
                // UUID provided - convert to internal ID
                $order = Order::where('tenant_id', $tenantId)
                    ->where('uuid', $orderId)
                    ->first();
                if ($order) {
                    $query->where('order_id', $order->id);
                }
            }
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
    public function store(\App\Infrastructure\Presentation\Http\Requests\Quote\StoreQuoteRequest $request)
    {
        try {
            $tenantId = $this->getCurrentTenantId($request);
            
            // Convert UUIDs to internal IDs with tenant isolation validation
            $order = Order::where('tenant_id', $tenantId)
                ->where('uuid', $request->input('order_id'))
                ->first();
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found or does not belong to your tenant',
                    'errors' => [
                        'order_id' => ['The selected order is invalid or does not belong to your tenant.']
                    ]
                ], 422);
            }
                
            $vendor = Vendor::where('tenant_id', $tenantId)
                ->where('uuid', $request->input('vendor_id'))
                ->first();
            
            if (!$vendor) {
                return response()->json([
                    'success' => false,
                    'message' => 'Vendor not found or does not belong to your tenant',
                    'errors' => [
                        'vendor_id' => ['The selected vendor is invalid or does not belong to your tenant.']
                    ]
                ], 422);
            }
            
            // Build quote_details JSON structure
            $items = $request->input('items', []);
            
            // If no items provided, use order items as fallback
            if (empty($items) && !empty($order->items)) {
                $items = $order->items;
            }
            
            $quoteDetails = [
                'title' => $request->input('title'),
                'description' => $request->input('description'),
                'terms_and_conditions' => $request->input('terms_and_conditions'),
                'terms' => $request->input('terms'), // For multi-quote comparison
                'notes' => $request->input('notes'),
                'lead_time_days' => $request->input('lead_time_days'),
                'items' => $this->enrichItemsWithFormSchema($items, $order),
            ];
            
            // Calculate latest_offer from initial_offer
            // Frontend sends price in dollars/rupiah, convert to cents
            $initialOfferDecimal = (float) $request->input('initial_offer');
            $initialOffer = (int) ($initialOfferDecimal * 100); // Convert to cents
            
            // Set default valid_until if not provided (30 days from now)
            $validUntil = $request->input('valid_until') 
                ? $request->input('valid_until') 
                : now()->addDays(30)->toDateString();
            
            // Create quote record
            $quote = OrderVendorNegotiation::create([
                'tenant_id' => $tenantId,
                'order_id' => $order->id,
                'vendor_id' => $vendor->id,
                'initial_offer' => $initialOffer,
                'latest_offer' => $initialOffer,
                'currency' => $request->input('currency', 'IDR'),
                'quote_details' => $quoteDetails,
                'status' => 'draft', // Initial status as per requirements
                'status_history' => [[
                    'from' => null,
                    'to' => 'draft',
                    'changed_by' => auth()->id(),
                    'changed_at' => now()->toIso8601String(),
                    'reason' => 'Quote created'
                ]],
                'expires_at' => $validUntil,
                'round' => 1,
                'history' => [[
                    'action' => 'created',
                    'timestamp' => now()->toIso8601String(),
                    'user_id' => auth()->id(),
                ]],
            ]);
            
            // Load relationships for response
            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'message' => 'Quote created successfully'
            ], 201);
            
        } catch (\InvalidArgumentException $e) {
            \Log::warning('Quote creation validation failed', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'tenant_id' => $tenantId ?? null,
                'request_data' => $request->except(['password', 'token']),
                'timestamp' => now()->toIso8601String(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);
            
        } catch (\Exception $e) {
            \Log::error('Quote creation failed', [
                'error' => $e->getMessage(),
                'error_class' => get_class($e),
                'user_id' => auth()->id(),
                'tenant_id' => $tenantId ?? null,
                'request_data' => $request->except(['password', 'token']),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'timestamp' => now()->toIso8601String(),
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create quote'
            ], 500);
        }
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
            'status' => 'sometimes|in:draft,sent,pending_response,countered,accepted,rejected,expired',
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
        $quote = OrderVendorNegotiation::withoutGlobalScopes()
            ->where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate tenant isolation: order must belong to same tenant as quote
        if (!$quote->order || $quote->order->tenant_id !== $tenantId) {
            return response()->json([
                'message' => 'Cross-tenant operation not allowed'
            ], 422);
        }

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
        if (!in_array($quote->status, ['draft', 'sent', 'pending_response', 'countered'])) { // Updated to new status enum
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
                ->whereIn('status', ['draft', 'sent', 'pending_response', 'countered']) // Updated to new status enum
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
                $vendorName = $quote->vendor ? $quote->vendor->name : 'Unknown Vendor';
                DB::table('order_status_histories')->insert([
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'previous_status' => 'vendor_negotiation',
                    'new_status' => 'customer_quote',
                    'changed_by' => auth()->id(),
                    'changed_by_name' => auth()->user()->name ?? 'System',
                    'notes' => "Quote {$quote->uuid} accepted. Vendor: {$vendorName}",
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
                ->whereIn('status', ['draft', 'sent', 'pending_response', 'countered'])
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
     * Send quote to vendor.
     */
    public function sendToVendor(Request $request, string $id)
    {
        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate quote can be sent
        if ($quote->status !== 'draft') {
            return response()->json([
                'message' => 'Only draft quotes can be sent to vendors'
            ], 422);
        }

        // Validate vendor has email
        if (!$quote->vendor || !$quote->vendor->email) {
            return response()->json([
                'message' => 'Vendor does not have an email address configured'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update status history
            $statusHistory = $quote->status_history ?? [];
            $statusHistory[] = [
                'from' => $quote->status,
                'to' => 'sent',
                'changed_by' => auth()->id(),
                'changed_at' => now()->toIso8601String(),
                'reason' => 'Quote sent to vendor'
            ];

            // Update quote
            $quote->update([
                'status' => 'sent',
                'sent_at' => now(),
                'status_history' => $statusHistory,
            ]);

            // Send email notification to vendor if portal access is enabled
            if ($quote->vendor->portal_access_enabled) {
                try {
                    $emailService = app(\App\Infrastructure\Services\Email\EmailServiceInterface::class);
                    
                    // Prepare quote data for email
                    $quoteData = [
                        'quote_number' => $quote->uuid,
                        'order_number' => $quote->order->order_number ?? 'N/A',
                        'customer_name' => $quote->order->customer->name ?? 'N/A',
                        'product_name' => $this->extractProductName($quote),
                        'expires_at' => $quote->expires_at ? $quote->expires_at->format('Y-m-d H:i:s') : null,
                        'quote_url' => config('app.vendor_portal_url') . '/vendor/quotes/' . $quote->uuid,
                    ];
                    
                    $emailService->sendNewQuoteNotification(
                        $quote->vendor->email,
                        $quote->vendor->name ?? $quote->vendor->company_name ?? 'Vendor',
                        $quoteData
                    );
                    
                    \Log::info('Quote sent notification email queued', [
                        'quote_id' => $quote->uuid,
                        'vendor_email' => $quote->vendor->email,
                        'vendor_name' => $quote->vendor->name,
                    ]);
                } catch (\Exception $e) {
                    // Log error but don't fail the request
                    \Log::error('Failed to send quote notification email', [
                        'quote_id' => $quote->uuid,
                        'vendor_email' => $quote->vendor->email,
                        'error' => $e->getMessage(),
                    ]);
                }
            }

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'message' => 'Quote sent to vendor successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Update quote status.
     */
    public function updateStatus(Request $request, string $id)
    {
        $request->validate([
            'status' => 'required|in:draft,sent,pending_response,accepted,rejected,countered,expired',
            'reason' => 'sometimes|string|max:1000'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        $newStatus = $request->input('status');
        $reason = $request->input('reason');

        // Validate status transition
        $validTransitions = $this->getValidStatusTransitions($quote->status);
        if (!in_array($newStatus, $validTransitions)) {
            return response()->json([
                'message' => "Cannot transition from {$quote->status} to {$newStatus}",
                'valid_transitions' => $validTransitions
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update status history
            $statusHistory = $quote->status_history ?? [];
            $statusHistory[] = [
                'from' => $quote->status,
                'to' => $newStatus,
                'changed_by' => auth()->id(),
                'changed_at' => now()->toIso8601String(),
                'reason' => $reason ?? "Status changed to {$newStatus}"
            ];

            $updateData = [
                'status' => $newStatus,
                'status_history' => $statusHistory,
            ];

            // Set timestamps based on status
            if ($newStatus === 'sent' && !$quote->sent_at) {
                $updateData['sent_at'] = now();
            }

            if (in_array($newStatus, ['accepted', 'rejected', 'expired']) && !$quote->closed_at) {
                $updateData['closed_at'] = now();
            }

            $quote->update($updateData);

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'message' => 'Quote status updated successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Get valid status transitions for current status.
     */
    private function getValidStatusTransitions(string $currentStatus): array
    {
        return match($currentStatus) {
            'draft' => ['sent'],
            'sent' => ['pending_response', 'expired'],
            'pending_response' => ['accepted', 'rejected', 'countered', 'expired'],
            'countered' => ['accepted', 'rejected', 'expired'],
            'accepted', 'rejected', 'expired' => [], // Terminal states
            default => []
        };
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
            'draft_quotes' => OrderVendorNegotiation::where('tenant_id', $tenantId)->where('status', 'draft')->count(),
            'sent_quotes' => OrderVendorNegotiation::where('tenant_id', $tenantId)->where('status', 'sent')->count(),
            'pending_quotes' => OrderVendorNegotiation::where('tenant_id', $tenantId)->where('status', 'pending_response')->count(),
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
    public function pdf(Request $request, string $id)
    {
        try {
            $tenantId = $this->getCurrentTenantId($request);
            
            \Log::info('[QuoteController::pdf] Starting PDF generation', [
                'quote_uuid' => $id,
                'tenant_id' => $tenantId,
            ]);
            
            // Fetch quote with relationships
            $quote = OrderVendorNegotiation::with(['order.customer', 'vendor'])
                ->where('tenant_id', $tenantId)
                ->where('uuid', $id)
                ->firstOrFail();

            \Log::info('[QuoteController::pdf] Quote found', [
                'quote_id' => $quote->id,
                'order_id' => $quote->order_id,
                'vendor_id' => $quote->vendor_id,
                'has_customer' => $quote->order && $quote->order->customer ? 'yes' : 'no',
                'has_vendor' => $quote->vendor ? 'yes' : 'no',
            ]);

            // Transform quote to frontend format
            $quoteData = $this->transformQuoteToFrontend($quote);
            
            \Log::info('[QuoteController::pdf] Quote transformed', [
                'quote_number' => $quoteData['quote_number'],
                'items_count' => count($quoteData['items'] ?? []),
                'grand_total' => $quoteData['grand_total'] ?? 0,
                'has_customer' => !empty($quoteData['customer']),
                'has_vendor' => !empty($quoteData['vendor']),
            ]);
            
            // Get exchange rate
            $exchangeRate = (float) config('app.default_exchange_rate', 15750);
            
            // Generate PDF
            $pdf = \PDF::loadView('pdf.quote', [
                'quote' => $quoteData,
                'exchangeRate' => $exchangeRate,
            ]);
            
            // Set paper size and orientation
            $pdf->setPaper('a4', 'portrait');
            
            // Set PDF options
            $pdf->setOptions([
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'defaultFont' => 'DejaVu Sans',
            ]);
            
            // Generate filename
            $filename = 'quote-' . $quoteData['quote_number'] . '.pdf';
            
            \Log::info('[QuoteController::pdf] PDF generated successfully', [
                'filename' => $filename,
            ]);
            
            // Return PDF as download
            return $pdf->download($filename);
            
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            \Log::error('[QuoteController::pdf] Quote not found', [
                'quote_uuid' => $id,
                'error' => $e->getMessage(),
            ]);
            
            return response()->json([
                'message' => 'Quote not found'
            ], 404);
            
        } catch (\Exception $e) {
            \Log::error('[QuoteController::pdf] PDF generation failed', [
                'quote_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'Failed to generate PDF: ' . $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : null,
            ], 500);
        }
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
            // product_id could be either UUID or integer ID (after prepareForValidation)
            // Check if product_uuid exists (set by prepareForValidation)
            $productUuid = $item['product_uuid'] ?? $item['product_id'] ?? null;
            $productId = null;
            
            // Get form schema from product_form_configurations
            $formSchema = null;
            if ($productUuid) {
                // If it's a UUID string, fetch product by UUID
                if (is_string($productUuid) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $productUuid)) {
                    $product = \App\Infrastructure\Persistence\Eloquent\Models\Product::where('uuid', $productUuid)
                        ->where('tenant_id', $order->tenant_id)
                        ->first();
                    
                    if ($product) {
                        $productId = $product->id;
                    }
                } elseif (is_numeric($productUuid) || is_int($productUuid)) {
                    // It's already an integer ID
                    $productId = (int)$productUuid;
                } elseif (isset($item['product_id']) && is_numeric($item['product_id'])) {
                    // Fallback to product_id if it's numeric
                    $productId = (int)$item['product_id'];
                }
                
                // Fetch ProductFormConfiguration by product_id
                if ($productId) {
                    $formConfig = \App\Models\ProductFormConfiguration::where('product_id', $productId)
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
        
        // Calculate totals from items (items already have correct values)
        $totalAmount = 0; // Total customer price
        $totalVendorCost = 0; // Total vendor cost
        
        foreach ($transformedItems as $item) {
            $totalAmount += $item['total_unit_price'] ?? 0;
            $totalVendorCost += $item['total_vendor_cost'] ?? 0;
        }
        
        // Calculate profit margin from items
        $profitMarginIDR = $totalAmount - $totalVendorCost;
        $profitMarginPercentage = $totalVendorCost > 0 
            ? (($profitMarginIDR / $totalVendorCost) * 100) 
            : 0;
        
        // Use calculated totals or fallback to negotiation values
        $grandTotalIDR = $totalAmount > 0 ? $totalAmount : ($negotiation->latest_offer ?? 0);
        $vendorCostIDR = $totalVendorCost > 0 ? $totalVendorCost : 0;
        
        // Convert monetary values to USD
        $grandTotalUSD = $grandTotalIDR / $exchangeRate;
        $vendorCostUSD = $vendorCostIDR / $exchangeRate;
        $profitMarginUSD = $profitMarginIDR / $exchangeRate;
        
        // Generate quote number with date-based format for better scalability
        // Format: QT-{YYYYMM}-{ID} (e.g., QT-202602-00123)
        // This format scales to millions of quotes per month
        $quoteNumber = $negotiation->created_at 
            ? sprintf('QT-%s-%05d', $negotiation->created_at->format('Ym'), $negotiation->id)
            : 'QT-DRAFT';
        
        return [
            'id' => $negotiation->uuid,
            'quote_number' => $quoteNumber,
            'order_id' => $negotiation->order->uuid ?? null,
            'order_number' => $negotiation->order->order_number ?? null,
            
            // Quote details from terms JSON
            'title' => $title,
            'description' => $description,
            'terms_and_conditions' => $termsAndConditions,
            'notes' => $notes,
            'lead_time_days' => $quoteDetails['lead_time_days'] ?? null,
            
            // Add specifications and quantity at root level for compatibility
            'specifications' => $negotiation->specifications ?? [],
            'quantity' => !empty($quoteItems) && isset($quoteItems[0]['quantity']) ? $quoteItems[0]['quantity'] : 0,
            
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
            'status_label' => $this->getStatusLabel($negotiation->status),
            'status_color' => $this->getStatusColor($negotiation->status),
            'status_history' => $negotiation->status_history ?? [],
            'type' => 'vendor_quote', // Default type for OrderVendorNegotiation
            
            // Monetary values in IDR (already in correct format from items)
            'quoted_price' => $grandTotalIDR, // Total customer price
            'original_price' => $grandTotalIDR, // Same as quoted_price for now
            'grand_total' => $grandTotalIDR, // Total customer price
            'total_amount' => $grandTotalIDR, // Alias
            'tax_amount' => 0, // No tax for now
            
            // USD conversions
            'quoted_price_usd' => round($grandTotalUSD, 2),
            'original_price_usd' => round($grandTotalUSD, 2),
            'grand_total_usd' => round($grandTotalUSD, 2),
            
            // Items count from quote items or order items
            'items_count' => $itemsCount,
            
            // Profit margin calculations (from items)
            'profit_margin' => $profitMarginIDR,
            'profit_margin_usd' => round($profitMarginUSD, 2),
            'profit_margin_percentage' => round($profitMarginPercentage, 2),
            'total_vendor_cost' => $vendorCostIDR, // Total vendor cost
            'total_vendor_cost_usd' => round($vendorCostUSD, 2),
            
            'currency' => $negotiation->currency,
            'exchange_rate' => $exchangeRate,
            'valid_until' => $negotiation->expires_at?->toISOString(),
            'terms' => $negotiation->quote_details ?? [], // Use quote_details instead of terms
            'quote_details' => $negotiation->quote_details ?? [], // Add quote_details for frontend compatibility
            
            // Items from quote details (transformed with all fields and calculations)
            'items' => $transformedItems,
            
            // Vendor response tracking (Phase 2 preparation)
            'sent_at' => $negotiation->sent_at?->toISOString(),
            'responded_at' => $negotiation->responded_at?->toISOString(),
            'response_type' => $negotiation->response_type,
            'response_notes' => $negotiation->response_notes,
            'counter_offer_amount' => $negotiation->latest_offer ?? null, // Legacy field
            'estimated_delivery_days' => $quoteDetails['estimated_delivery_days'] ?? null,
            'vendor_viewed_at' => null, // Will be populated when vendor views quote
            'vendor_response' => null, // Will contain vendor's response data
            'response_token' => null, // Will contain unique token for vendor response
            
            'metadata' => [
                'round' => $negotiation->round,
                'max_rounds' => $quoteDetails['max_rounds'] ?? 5, // Default 5 rounds
                'history' => $negotiation->history ?? [],
            ],
            'round' => $negotiation->round, // Also at root level for easier access
            'max_rounds' => $quoteDetails['max_rounds'] ?? 5, // Also at root level for easier access
            'history' => $negotiation->history ?? [], // Also at root level for easier access
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
     * Vendor accepts a quote.
     */
    public function vendorAccept(Request $request, string $id)
    {
        $request->validate([
            'notes' => 'sometimes|string|max:1000',
            'estimated_delivery_days' => 'sometimes|integer|min:1|max:365'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate quote can be accepted by vendor
        if (!in_array($quote->status, ['sent', 'pending_response'])) {
            return response()->json([
                'message' => 'Quote cannot be accepted in current status: ' . $quote->status
            ], 422);
        }

        // Check if quote has expired
        if ($quote->expires_at && $quote->expires_at < now()) {
            return response()->json([
                'message' => 'Quote has expired and cannot be accepted'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update status history
            $statusHistory = $quote->status_history ?? [];
            $statusHistory[] = [
                'from' => $quote->status,
                'to' => 'accepted',
                'changed_by' => auth()->id(),
                'changed_at' => now()->toIso8601String(),
                'reason' => 'Vendor accepted quote' . ($request->input('notes') ? ': ' . $request->input('notes') : '')
            ];

            $updateData = [
                'status' => 'accepted',
                'responded_at' => now(),
                'response_type' => 'accept',
                'response_notes' => $request->input('notes'),
                'closed_at' => now(),
                'status_history' => $statusHistory,
            ];

            // Store estimated delivery days if provided
            if ($request->filled('estimated_delivery_days')) {
                $quoteDetails = $quote->quote_details ?? [];
                $quoteDetails['estimated_delivery_days'] = $request->input('estimated_delivery_days');
                $updateData['quote_details'] = $quoteDetails;
            }

            $quote->update($updateData);

            // TODO: Send notification to admin (Phase 5)
            // This will be implemented in the notification system phase

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'message' => 'Quote accepted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Vendor rejects a quote.
     */
    public function vendorReject(Request $request, string $id)
    {
        $request->validate([
            'reason' => 'required|string|min:10|max:1000'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate quote can be rejected by vendor
        if (!in_array($quote->status, ['sent', 'pending_response'])) {
            return response()->json([
                'message' => 'Quote cannot be rejected in current status: ' . $quote->status
            ], 422);
        }

        // Check if quote has expired
        if ($quote->expires_at && $quote->expires_at < now()) {
            return response()->json([
                'message' => 'Quote has expired and cannot be rejected'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update status history
            $statusHistory = $quote->status_history ?? [];
            $statusHistory[] = [
                'from' => $quote->status,
                'to' => 'rejected',
                'changed_by' => auth()->id(),
                'changed_at' => now()->toIso8601String(),
                'reason' => 'Vendor rejected quote: ' . $request->input('reason')
            ];

            $quote->update([
                'status' => 'rejected',
                'responded_at' => now(),
                'response_type' => 'reject',
                'response_notes' => $request->input('reason'),
                'closed_at' => now(),
                'status_history' => $statusHistory,
            ]);

            // TODO: Send notification to admin (Phase 5)
            // This will be implemented in the notification system phase

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'message' => 'Quote rejected'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Vendor submits a counter offer.
     */
    public function vendorCounter(Request $request, string $id)
    {
        $request->validate([
            'counter_offer' => 'required|numeric|min:0',
            'notes' => 'sometimes|string|max:1000',
            'estimated_delivery_days' => 'sometimes|integer|min:1|max:365'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate quote can be countered by vendor
        if (!in_array($quote->status, ['sent', 'pending_response'])) {
            return response()->json([
                'message' => 'Quote cannot be countered in current status: ' . $quote->status
            ], 422);
        }

        // Check if quote has expired
        if ($quote->expires_at && $quote->expires_at < now()) {
            return response()->json([
                'message' => 'Quote has expired and cannot be countered'
            ], 422);
        }

        DB::beginTransaction();
        try {
            $counterOffer = (int) ($request->input('counter_offer')); // Already in cents from frontend

            // Update status history
            $statusHistory = $quote->status_history ?? [];
            $statusHistory[] = [
                'from' => $quote->status,
                'to' => 'countered',
                'changed_by' => auth()->id(),
                'changed_at' => now()->toIso8601String(),
                'reason' => 'Vendor countered quote' . ($request->input('notes') ? ': ' . $request->input('notes') : '')
            ];

            // Add to negotiation history
            $history = $quote->history ?? [];
            $history[] = [
                'action' => 'counter_offered',
                'previous_offer' => $quote->latest_offer,
                'new_offer' => $counterOffer,
                'notes' => $request->input('notes'),
                'timestamp' => now()->toISOString(),
                'user_id' => auth()->id(),
            ];

            $updateData = [
                'status' => 'countered',
                'latest_offer' => $counterOffer,
                'round' => $quote->round + 1,
                'responded_at' => now(),
                'response_type' => 'counter',
                'response_notes' => $request->input('notes'),
                'status_history' => $statusHistory,
                'history' => $history,
            ];

            // Store estimated delivery days if provided
            if ($request->filled('estimated_delivery_days')) {
                $quoteDetails = $quote->quote_details ?? [];
                $quoteDetails['estimated_delivery_days'] = $request->input('estimated_delivery_days');
                $updateData['quote_details'] = $quoteDetails;
            }

            $quote->update($updateData);

            // TODO: Send notification to admin (Phase 5)
            // This will be implemented in the notification system phase

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'message' => 'Counter offer submitted successfully'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * List quotes for vendor.
     */
    public function vendorIndex(Request $request)
    {
        $perPage = $request->input('per_page', 15);
        $page = $request->input('page', 1);
        
        $tenantId = $this->getCurrentTenantId($request);
        
        // Get vendor ID from authenticated user
        // Note: In production, get vendor_id from user's vendor relationship
        $vendorId = $request->input('vendor_id'); // Temporary for testing
        
        if (!$vendorId) {
            return response()->json([
                'message' => 'Vendor ID is required'
            ], 422);
        }

        // Convert vendor UUID to internal ID if needed
        if (is_string($vendorId) && preg_match('/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i', $vendorId)) {
            $vendor = Vendor::where('tenant_id', $tenantId)
                ->where('uuid', $vendorId)
                ->firstOrFail();
            $vendorId = $vendor->id;
        }
        
        $query = OrderVendorNegotiation::with(['order.customer', 'vendor'])
            ->where('tenant_id', $tenantId)
            ->where('vendor_id', $vendorId);
            
        // Apply filters
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function (Builder $q) use ($search) {
                $q->whereHas('order', function (Builder $orderQuery) use ($search) {
                    $orderQuery->where('order_number', 'LIKE', "%{$search}%")
                        ->orWhereHas('customer', function (Builder $customerQuery) use ($search) {
                            $customerQuery->where('name', 'LIKE', "%{$search}%");
                        });
                });
            });
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
     * Get the current tenant ID.
     */
    private function getCurrentTenantId(Request $request): int
    {
        return $this->resolveTenant($request)->id;
    }

    /**
     * Get human-readable label for status.
     */
    private function getStatusLabel(string $status): string
    {
        return match($status) {
            'draft' => 'Draft',
            'sent' => 'Sent to Vendor',
            'pending_response' => 'Awaiting Response',
            'accepted' => 'Accepted',
            'rejected' => 'Rejected',
            'countered' => 'Counter Offer',
            'expired' => 'Expired',
            'open' => 'Open', // Legacy status
            'cancelled' => 'Cancelled', // Legacy status
            default => ucfirst($status)
        };
    }

    /**
     * Get color code for status.
     */
    private function getStatusColor(string $status): string
    {
        return match($status) {
            'draft' => 'gray',
            'sent' => 'blue',
            'pending_response' => 'yellow',
            'accepted' => 'green',
            'rejected' => 'red',
            'countered' => 'orange',
            'expired' => 'gray',
            'open' => 'blue', // Legacy status
            'cancelled' => 'red', // Legacy status
            default => 'gray'
        };
    }

    /**
     * Extract product name from quote for email notifications.
     * 
     * @param OrderVendorNegotiation $quote
     * @return string
     */
    private function extractProductName(OrderVendorNegotiation $quote): string
    {
        // Try to get product name from quote details items
        $quoteDetails = $quote->quote_details ?? [];
        $items = $quoteDetails['items'] ?? [];
        
        if (!empty($items) && is_array($items)) {
            $firstItem = $items[0];
            
            // Try description first
            if (!empty($firstItem['description'])) {
                return $firstItem['description'];
            }
            
            // Try product name
            if (!empty($firstItem['product_name'])) {
                return $firstItem['product_name'];
            }
        }
        
        // Fallback to order items if available
        if ($quote->order && !empty($quote->order->items) && is_array($quote->order->items)) {
            $firstOrderItem = $quote->order->items[0];
            
            if (!empty($firstOrderItem['description'])) {
                return $firstOrderItem['description'];
            }
            
            if (!empty($firstOrderItem['product_name'])) {
                return $firstOrderItem['product_name'];
            }
        }
        
        // Final fallback
        return 'Product';
    }

    /**
     * Accept vendor counter offer.
     * 
     * This endpoint allows admin to accept a vendor's counter offer.
     * When accepted:
     * 1. Quote status changes to 'accepted'
     * 2. Quote items are updated with counter offer pricing
     * 3. Customer pricing is set (with profit margin)
     * 4. Order is updated with vendor and pricing data
     * 5. Order status changes to 'customer_quote'
     * 6. Latest offer is updated to counter offer total
     * 7. Status history is recorded
     * 8. Email notification sent to vendor
     */
    public function acceptCounterOffer(Request $request, string $id)
    {
        $request->validate([
            'customer_price' => 'required|numeric|min:0',
            'notes' => 'nullable|string|max:1000',
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate quote has counter offer
        if ($quote->status !== 'countered') {
            return response()->json([
                'message' => 'Quote does not have a counter offer to accept'
            ], 422);
        }

        // Validate counter offer data exists
        $quoteDetails = $quote->quote_details ?? [];
        $counterOffer = $quoteDetails['counter_offer'] ?? null;
        
        if (!$counterOffer || empty($counterOffer['items'])) {
            return response()->json([
                'message' => 'Counter offer data not found'
            ], 422);
        }

        // Get vendor counter offer total (in cents)
        $vendorCounterOffer = $counterOffer['total_counter'] ?? 0;
        
        // Get customer price from request (convert to cents)
        $customerPrice = (int) round($request->input('customer_price') * 100);
        
        // Validate customer price >= vendor price
        if ($customerPrice < $vendorCounterOffer) {
            return response()->json([
                'message' => 'Customer price must be greater than or equal to vendor counter offer',
                'details' => [
                    'vendor_counter_offer' => $vendorCounterOffer / 100,
                    'customer_price' => $customerPrice / 100,
                ]
            ], 422);
        }
        
        // Calculate profit
        $profitAmount = $customerPrice - $vendorCounterOffer;
        $profitMarginPercent = $vendorCounterOffer > 0 
            ? ($profitAmount / $vendorCounterOffer) * 100 
            : 0;

        DB::beginTransaction();
        try {
            // Update quote items with counter offer pricing
            $updatedItems = [];
            foreach ($counterOffer['items'] as $counterItem) {
                // Find matching item in quote_details
                $matchingItem = null;
                foreach ($quoteDetails['items'] ?? [] as $quoteItem) {
                    if ($quoteItem['product_id'] === $counterItem['product_id']) {
                        $matchingItem = $quoteItem;
                        break;
                    }
                }

                if ($matchingItem) {
                    // Update with counter offer pricing
                    $updatedItems[] = array_merge($matchingItem, [
                        'vendor_cost' => $counterItem['counter_unit_price'],
                        'unit_price' => $counterItem['counter_unit_price'], // Keep vendor cost as unit price for now
                        'total_price' => $counterItem['counter_total_price'],
                    ]);
                }
            }

            // Update quote_details with new items and mark counter offer as accepted
            $quoteDetails['items'] = $updatedItems;
            $quoteDetails['counter_offer']['accepted_at'] = now()->toIso8601String();
            $quoteDetails['counter_offer']['accepted_by'] = auth()->id();
            $quoteDetails['counter_offer']['customer_price'] = $customerPrice;
            $quoteDetails['counter_offer']['profit_amount'] = $profitAmount;
            $quoteDetails['counter_offer']['profit_margin_percent'] = round($profitMarginPercent, 2);
            $quoteDetails['counter_offer']['acceptance_notes'] = $request->input('notes');

            // Update status history
            $statusHistory = $quote->status_history ?? [];
            $statusHistory[] = [
                'from' => $quote->status,
                'to' => 'accepted',
                'changed_by' => auth()->id(),
                'changed_at' => now()->toIso8601String(),
                'reason' => 'Admin accepted vendor counter offer with customer pricing',
                'customer_price' => $customerPrice / 100,
                'profit_margin_percent' => round($profitMarginPercent, 2),
            ];

            // Update quote
            $quote->update([
                'status' => 'accepted',
                'latest_offer' => $counterOffer['total_counter'],
                'quote_details' => $quoteDetails,
                'responded_at' => now(),
                'closed_at' => now(),
                'status_history' => $statusHistory,
            ]);

            // Update order with vendor and pricing data
            $order = $quote->order;
            $order->update([
                'vendor_id' => $quote->vendor_id,
                'vendor_quoted_price' => $vendorCounterOffer,
                'quotation_amount' => $customerPrice,
                'profit_margin_percent' => round($profitMarginPercent, 2),
                'profit_amount' => $profitAmount,
                'status' => 'customer_quote', // Move to next workflow step
            ]);

            // Send email notification to vendor
            try {
                $emailService = app(\App\Infrastructure\Services\Email\QuoteNotificationService::class);
                $emailService->sendVendorAcceptanceEmail($quote);
                
                \Log::info('[QuoteController::acceptCounterOffer] Acceptance email sent to vendor', [
                    'quote_id' => $quote->uuid,
                    'vendor_email' => $quote->vendor->email,
                ]);
            } catch (\Exception $e) {
                // Log error but don't fail the request
                \Log::error('[QuoteController::acceptCounterOffer] Failed to send acceptance email', [
                    'quote_id' => $quote->uuid,
                    'error' => $e->getMessage(),
                ]);
            }

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => array_merge($this->transformQuoteToFrontend($quote), [
                    'vendor_quoted_price' => $vendorCounterOffer / 100,
                    'quotation_amount' => $customerPrice / 100,
                    'profit_margin_percent' => round($profitMarginPercent, 2),
                    'profit_amount' => $profitAmount / 100,
                    'order_status' => $order->status,
                ]),
                'message' => 'Counter offer accepted successfully. Vendor has been notified via email.'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('[QuoteController::acceptCounterOffer] Failed to accept counter offer', [
                'quote_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Reject vendor counter offer.
     * 
     * This endpoint allows admin to reject a vendor's counter offer.
     * When rejected:
     * 1. Quote status changes to 'rejected'
     * 2. Rejection reason is recorded
     * 3. Status history is updated
     * 4. Quote is closed
     * 5. Email notification sent to vendor
     */
    public function rejectCounterOffer(Request $request, string $id)
    {
        $request->validate([
            'reason' => 'required|string|min:10|max:1000'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->with(['order', 'vendor'])
            ->firstOrFail();

        // Validate quote has counter offer
        if ($quote->status !== 'countered') {
            return response()->json([
                'message' => 'Quote does not have a counter offer to reject'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Store rejection in history (allow multiple rejections)
            $quoteDetails = $quote->quote_details ?? [];
            
            // Initialize rejection_history if not exists
            if (!isset($quoteDetails['rejection_history'])) {
                $quoteDetails['rejection_history'] = [];
            }
            
            // Count current rejections
            $rejectionCount = count($quoteDetails['rejection_history']);
            $isSecondRejection = $rejectionCount >= 1; // This will be the 2nd rejection
            
            // Add current rejection to history
            $quoteDetails['rejection_history'][] = [
                'rejection_number' => $rejectionCount + 1,
                'rejected_at' => now()->toIso8601String(),
                'rejected_by' => auth()->id(),
                'rejection_reason' => $request->input('reason'),
                'counter_offer' => $quoteDetails['counter_offer'] ?? null, // Store rejected counter offer
            ];
            
            // Mark current counter offer as rejected
            if (isset($quoteDetails['counter_offer'])) {
                $quoteDetails['counter_offer']['rejected_at'] = now()->toIso8601String();
                $quoteDetails['counter_offer']['rejected_by'] = auth()->id();
                $quoteDetails['counter_offer']['rejection_reason'] = $request->input('reason');
            }

            // Update status history
            $statusHistory = $quote->status_history ?? [];
            
            // Determine new status based on rejection count
            $newStatus = $isSecondRejection ? 'rejected' : 'sent';
            $statusReason = $isSecondRejection 
                ? 'Admin rejected vendor counter offer for the 2nd time. Quote closed - maximum rejections reached.'
                : 'Admin rejected vendor counter offer (Rejection 1 of 2). Vendor can submit one more counter offer.';
            
            $statusHistory[] = [
                'from' => $quote->status,
                'to' => $newStatus,
                'changed_by' => auth()->id(),
                'changed_at' => now()->toIso8601String(),
                'reason' => $statusReason . ' Reason: ' . $request->input('reason')
            ];

            // Update quote
            $updateData = [
                'status' => $newStatus,
                'quote_details' => $quoteDetails,
                'rejection_reason' => $request->input('reason'),
                'responded_at' => now(),
                'status_history' => $statusHistory,
            ];
            
            // Close quote if this is the 2nd rejection
            if ($isSecondRejection) {
                $updateData['closed_at'] = now();
            }
            
            $quote->update($updateData);

            // Send email notification to vendor
            try {
                $emailService = app(\App\Infrastructure\Services\Email\QuoteNotificationService::class);
                $emailService->sendVendorRejectionEmail($quote, $request->input('reason'));
                
                \Log::info('[QuoteController::rejectCounterOffer] Rejection email sent to vendor', [
                    'quote_id' => $quote->uuid,
                    'vendor_email' => $quote->vendor->email,
                    'rejection_count' => $rejectionCount + 1,
                    'is_final_rejection' => $isSecondRejection,
                ]);
            } catch (\Exception $e) {
                // Log error but don't fail the request
                \Log::error('[QuoteController::rejectCounterOffer] Failed to send rejection email', [
                    'quote_id' => $quote->uuid,
                    'error' => $e->getMessage(),
                ]);
            }

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            $message = $isSecondRejection
                ? 'Counter offer rejected. Maximum rejections (2) reached - this quote is now closed. Please select a different vendor for this order.'
                : 'Counter offer rejected successfully. Vendor has been notified via email and can submit one more counter offer (1 of 2 rejections used).';

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'rejection_count' => $rejectionCount + 1,
                'max_rejections_reached' => $isSecondRejection,
                'message' => $message
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('[QuoteController::rejectCounterOffer] Failed to reject counter offer', [
                'quote_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }

    /**
     * Admin counter offer to vendor's counter offer
     * 
     * POST /api/v1/tenant/quotes/{id}/admin-counter-offer
     * 
     * Enables two-way negotiation between admin and vendor.
     * Admin can propose a counter price instead of just accept/reject.
     * 
     * @param AdminCounterOfferRequest $request
     * @param string $id Quote UUID
     * @return \Illuminate\Http\JsonResponse
     */
    public function adminCounterOffer(\App\Http\Requests\Tenant\AdminCounterOfferRequest $request, string $id)
    {
        $tenantId = $this->getCurrentTenantId($request);
        
        try {
            // Get authenticated user
            $userId = auth()->id();
            
            // Create command
            $command = new \App\Application\Quote\Commands\AdminCounterOfferCommand(
                quoteUuid: $id,
                tenantId: $tenantId,
                adminCounterOffer: (int) round($request->input('counter_offer_amount') * 100), // Convert to cents
                items: $request->input('items'),
                notes: $request->input('notes'),
                userId: $userId,
                ipAddress: $request->ip(),
                userAgent: $request->userAgent()
            );
            
            // Execute use case
            $useCase = app(\App\Application\Quote\UseCases\AdminCounterOfferUseCase::class);
            $result = $useCase->execute($command);
            
            return response()->json([
                'success' => true,
                'message' => 'Counter offer sent to vendor successfully',
                'data' => $result,
            ], 200);
            
        } catch (\App\Domain\Quote\Exceptions\InvalidStatusTransitionException $e) {
            return response()->json([
                'message' => 'Cannot counter offer',
                'error' => $e->getMessage(),
            ], 422);
        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            \Log::error('[QuoteController::adminCounterOffer] Error', [
                'quote_uuid' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            return response()->json([
                'message' => 'An error occurred while sending counter offer',
                'error' => 'Internal server error',
            ], 500);
        }
    }
}
