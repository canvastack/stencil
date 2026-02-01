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
            'terms' => 'sometimes|array',
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
        
        $quote = OrderVendorNegotiation::create([
            'tenant_id' => $tenantId,
            'order_id' => $order->id,
            'vendor_id' => $vendor->id,
            'initial_offer' => $request->input('initial_offer') * 100, // Convert to cents
            'latest_offer' => $request->input('initial_offer') * 100,
            'currency' => $request->input('currency', 'IDR'),
            'terms' => $request->input('terms', []),
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
            'latest_offer' => 'sometimes|numeric|min:0',
            'terms' => 'sometimes|array',
            'expires_at' => 'sometimes|date|after:now',
            'status' => 'sometimes|in:open,countered,accepted,rejected,cancelled,expired',
        ]);

        $updateData = [];
        
        if ($request->filled('latest_offer')) {
            $updateData['latest_offer'] = $request->input('latest_offer') * 100;
        }
        
        if ($request->filled('terms')) {
            $updateData['terms'] = $request->input('terms');
        }
        
        if ($request->filled('expires_at')) {
            $updateData['expires_at'] = $request->input('expires_at');
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

        if ($quote->expires_at && $quote->expires_at < now()) {
            return response()->json([
                'message' => 'Quote has expired'
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Update quote status to accepted
            $quote->update([
                'status' => 'accepted',
                'closed_at' => now(),
            ]);

            // Reject all other open quotes for the same order
            OrderVendorNegotiation::where('tenant_id', $tenantId)
                ->where('order_id', $quote->order_id)
                ->where('id', '!=', $quote->id)
                ->whereIn('status', ['open', 'countered'])
                ->update([
                    'status' => 'rejected',
                    'closed_at' => now(),
                ]);

            // Sync data to order if order is in vendor_negotiation stage
            if ($quote->order && $quote->order->status === 'vendor_negotiation') {
                $this->syncQuoteToOrder($quote);
            }

            DB::commit();

            $quote->load(['order.customer', 'vendor']);

            return response()->json([
                'data' => $this->transformQuoteToFrontend($quote),
                'message' => 'Quote accepted and order data synchronized'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Sync accepted quote data to order.
     * 
     * @param OrderVendorNegotiation $quote
     * @return void
     * @throws \RuntimeException if tenant_id mismatch detected
     */
    private function syncQuoteToOrder(OrderVendorNegotiation $quote): void
    {
        $order = $quote->order;

        // Validate tenant isolation - critical security check
        if ($quote->tenant_id !== $order->tenant_id) {
            // Log security warning for investigation
            \Log::warning('Cross-tenant sync attempt detected', [
                'quote_id' => $quote->id,
                'quote_uuid' => $quote->uuid,
                'quote_tenant_id' => $quote->tenant_id,
                'order_id' => $order->id,
                'order_uuid' => $order->uuid,
                'order_tenant_id' => $order->tenant_id,
                'user_id' => auth()->id(),
                'timestamp' => now()->toISOString(),
            ]);

            throw new \RuntimeException(
                'Cross-tenant data synchronization is not allowed. Quote and order must belong to the same tenant.'
            );
        }

        // Sync vendor pricing
        $order->vendor_quoted_price = $quote->latest_offer;
        $order->vendor_id = $quote->vendor_id;
        $order->vendor_terms = $quote->terms;

        // Calculate quotation amount (30% markup + 5% operational cost = 1.35 multiplier)
        $markup = 0.30;
        $operationalCost = 0.05;
        $order->quotation_amount = (int) ($quote->latest_offer * (1 + $markup + $operationalCost));

        $order->save();
    }

    /**
     * Reject the specified quote.
     */
    public function reject(Request $request, string $id)
    {
        $request->validate([
            'reason' => 'required|string|max:1000'
        ]);

        $tenantId = $this->getCurrentTenantId($request);
        $quote = OrderVendorNegotiation::where('tenant_id', $tenantId)
            ->where('uuid', $id)
            ->firstOrFail();

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

        $quote->load(['order.customer', 'vendor']);

        return response()->json([
            'data' => $this->transformQuoteToFrontend($quote)
        ]);
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
     * Transform backend OrderVendorNegotiation to frontend-expected format.
     */
    private function transformQuoteToFrontend(OrderVendorNegotiation $negotiation): array
    {
        $customer = $negotiation->order->customer ?? null;
        $vendor = $negotiation->vendor ?? null;
        
        return [
            'id' => $negotiation->uuid,
            'quote_number' => 'Q-' . str_pad($negotiation->id, 6, '0', STR_PAD_LEFT), // Generate quote number
            'order_id' => $negotiation->order->uuid ?? null,
            'order_number' => $negotiation->order->order_number ?? null,
            'customer' => $customer ? [
                'id' => $customer->uuid,
                'name' => $customer->name,
                'email' => $customer->email,
                'company' => $customer->company ?? null,
            ] : null,
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
            'quoted_price' => $negotiation->latest_offer ? $negotiation->latest_offer / 100 : 0, // Convert back to dollars
            'original_price' => $negotiation->initial_offer ? $negotiation->initial_offer / 100 : 0,
            'grand_total' => $negotiation->latest_offer ? $negotiation->latest_offer / 100 : 0, // Alias for sorting
            'currency' => $negotiation->currency,
            'valid_until' => $negotiation->expires_at?->toISOString(),
            'terms' => $negotiation->terms ?? [],
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