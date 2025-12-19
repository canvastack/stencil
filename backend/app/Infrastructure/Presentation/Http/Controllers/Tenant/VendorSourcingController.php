<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\VendorSourcing;
use App\Infrastructure\Persistence\Eloquent\Models\VendorQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Str;

class VendorSourcingController extends Controller
{
    /**
     * Get vendor sourcing requests
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'status' => 'nullable|string|in:active,pending,negotiating,awarded,cancelled',
                'order_id' => 'nullable|integer|exists:orders,id',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'per_page' => 'nullable|integer|min:1|max:100',
                'page' => 'nullable|integer|min:1',
                'sort_by' => 'nullable|string|in:created_at,updated_at,status,title',
                'sort_order' => 'nullable|string|in:asc,desc',
            ]);

            $query = VendorSourcing::with(['order', 'quotes.vendor']);

            // Apply filters
            if (!empty($validated['status'])) {
                $query->where('status', $validated['status']);
            }

            if (!empty($validated['order_id'])) {
                $query->where('order_id', $validated['order_id']);
            }

            if (!empty($validated['vendor_id'])) {
                $query->whereHas('quotes', function ($q) use ($validated) {
                    $q->where('vendor_id', $validated['vendor_id']);
                });
            }

            // Apply sorting
            $sortBy = $validated['sort_by'] ?? 'created_at';
            $sortOrder = $validated['sort_order'] ?? 'desc';
            $query->orderBy($sortBy, $sortOrder);

            // Paginate
            $perPage = $validated['per_page'] ?? 20;
            $sourcingRequests = $query->paginate($perPage);

            // Transform data
            $transformedData = $sourcingRequests->getCollection()->map(function ($sourcing) {
                return [
                    'id' => $sourcing->id,
                    'uuid' => $sourcing->uuid,
                    'order_id' => $sourcing->order_id,
                    'title' => $sourcing->title,
                    'description' => $sourcing->description,
                    'status' => $sourcing->status,
                    'requirements' => $sourcing->requirements,
                    'responses' => $sourcing->quotes->count(),
                    'best_quote' => $sourcing->quotes->min('quoted_price'),
                    'assigned_vendor' => $sourcing->assigned_vendor_name,
                    'created_at' => $sourcing->created_at->toIso8601String(),
                    'updated_at' => $sourcing->updated_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Vendor sourcing requests retrieved successfully',
                'data' => $transformedData,
                'meta' => [
                    'current_page' => $sourcingRequests->currentPage(),
                    'per_page' => $sourcingRequests->perPage(),
                    'total' => $sourcingRequests->total(),
                    'last_page' => $sourcingRequests->lastPage(),
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
                'message' => 'Failed to fetch vendor sourcing requests',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Create new vendor sourcing request
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'order_id' => 'required|integer|exists:orders,id',
                'title' => 'required|string|max:255',
                'description' => 'required|string|max:2000',
                'requirements' => 'required|array',
                'requirements.material' => 'required|string|max:100',
                'requirements.quantity' => 'required|integer|min:1',
                'requirements.quality_tier' => 'nullable|string|in:standard,premium,exclusive',
                'requirements.dimensions' => 'nullable|string|max:255',
                'requirements.finish_type' => 'nullable|string|max:100',
                'requirements.deadline' => 'required|date|after:today',
                'requirements.budget_range' => 'nullable|array',
                'requirements.budget_range.min' => 'nullable|numeric|min:0',
                'requirements.budget_range.max' => 'nullable|numeric|min:0',
                'vendor_ids' => 'nullable|array',
                'vendor_ids.*' => 'integer|exists:vendors,id',
            ]);

            $sourcing = VendorSourcing::create([
                'uuid' => Str::uuid(),
                'order_id' => $validated['order_id'],
                'title' => $validated['title'],
                'description' => $validated['description'],
                'requirements' => $validated['requirements'],
                'status' => 'active',
            ]);

            // If specific vendors are specified, create quotes for them
            if (!empty($validated['vendor_ids'])) {
                foreach ($validated['vendor_ids'] as $vendorId) {
                    VendorQuote::create([
                        'uuid' => Str::uuid(),
                        'sourcing_request_id' => $sourcing->id,
                        'vendor_id' => $vendorId,
                        'status' => 'pending',
                    ]);
                }
            } else {
                // Auto-select suitable vendors based on requirements
                $this->autoSelectVendors($sourcing);
            }

            $sourcing->load(['order', 'quotes.vendor']);

            return response()->json([
                'success' => true,
                'message' => 'Vendor sourcing request created successfully',
                'data' => [
                    'id' => $sourcing->id,
                    'uuid' => $sourcing->uuid,
                    'order_id' => $sourcing->order_id,
                    'title' => $sourcing->title,
                    'description' => $sourcing->description,
                    'status' => $sourcing->status,
                    'requirements' => $sourcing->requirements,
                    'responses' => $sourcing->quotes->count(),
                    'created_at' => $sourcing->created_at->toIso8601String(),
                ],
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
                'message' => 'Failed to create vendor sourcing request',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get quotes for a sourcing request
     */
    public function getQuotes(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'sourcing_id' => 'nullable|integer|exists:vendor_sourcing,id',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
                'status' => 'nullable|string|in:pending,submitted,accepted,rejected,expired',
            ]);

            $query = VendorQuote::with(['vendor', 'vendorSourcing.order']);

            // Apply filters
            if (!empty($validated['sourcing_id'])) {
                $query->where('sourcing_request_id', $validated['sourcing_id']);
            }

            if (!empty($validated['vendor_id'])) {
                $query->where('vendor_id', $validated['vendor_id']);
            }

            if (!empty($validated['status'])) {
                $query->where('status', $validated['status']);
            }

            $quotes = $query->orderBy('created_at', 'desc')->get();

            $transformedQuotes = $quotes->map(function ($quote) {
                return [
                    'id' => $quote->id,
                    'uuid' => $quote->uuid,
                    'vendor_id' => $quote->vendor_id,
                    'vendor_name' => $quote->vendor->name,
                    'vendor_email' => $quote->vendor->email,
                    'quoted_price' => $quote->quoted_price,
                    'lead_time_days' => $quote->lead_time_days,
                    'terms' => $quote->terms,
                    'notes' => $quote->notes,
                    'status' => $quote->status,
                    'submitted_at' => $quote->submitted_at?->toIso8601String(),
                    'expires_at' => $quote->expires_at?->toIso8601String(),
                    'created_at' => $quote->created_at->toIso8601String(),
                ];
            });

            return response()->json([
                'success' => true,
                'message' => 'Vendor quotes retrieved successfully',
                'data' => $transformedQuotes,
                'meta' => [
                    'total_quotes' => $quotes->count(),
                    'pending_quotes' => $quotes->where('status', 'pending')->count(),
                    'submitted_quotes' => $quotes->where('status', 'submitted')->count(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendor quotes',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Submit a quote from vendor
     */
    public function submitQuote(Request $request, int $sourcingId): JsonResponse
    {
        try {
            $validated = $request->validate([
                'vendor_id' => 'required|integer|exists:vendors,id',
                'quoted_price' => 'required|numeric|min:0',
                'lead_time_days' => 'required|integer|min:1',
                'terms' => 'nullable|string|max:1000',
                'notes' => 'nullable|string|max:2000',
                'expires_at' => 'nullable|date|after:today',
            ]);

            $sourcing = VendorSourcing::findOrFail($sourcingId);

            // Find or create quote
            $quote = VendorQuote::firstOrCreate(
                [
                    'sourcing_request_id' => $sourcingId,
                    'vendor_id' => $validated['vendor_id'],
                ],
                [
                    'uuid' => Str::uuid(),
                    'status' => 'pending',
                ]
            );

            // Update quote with submitted data
            $quote->update([
                'quoted_price' => $validated['quoted_price'],
                'lead_time_days' => $validated['lead_time_days'],
                'terms' => $validated['terms'] ?? null,
                'notes' => $validated['notes'] ?? null,
                'expires_at' => $validated['expires_at'] ? 
                    \Carbon\Carbon::parse($validated['expires_at']) : 
                    now()->addDays(30),
                'status' => 'submitted',
                'submitted_at' => now(),
            ]);

            $quote->load('vendor');

            return response()->json([
                'success' => true,
                'message' => 'Quote submitted successfully',
                'data' => [
                    'id' => $quote->id,
                    'uuid' => $quote->uuid,
                    'vendor_name' => $quote->vendor->name,
                    'quoted_price' => $quote->quoted_price,
                    'lead_time_days' => $quote->lead_time_days,
                    'status' => $quote->status,
                    'submitted_at' => $quote->submitted_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor sourcing request not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit quote',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Accept a vendor quote
     */
    public function acceptQuote(Request $request, int $sourcingId, int $quoteId): JsonResponse
    {
        try {
            $sourcing = VendorSourcing::findOrFail($sourcingId);
            $quote = VendorQuote::where('sourcing_request_id', $sourcingId)
                ->where('id', $quoteId)
                ->firstOrFail();

            // Update quote status
            $quote->update([
                'status' => 'accepted',
                'accepted_at' => now(),
            ]);

            // Update sourcing status
            $sourcing->update([
                'status' => 'awarded',
                'assigned_vendor_id' => $quote->vendor_id,
                'assigned_vendor_name' => $quote->vendor->name,
                'final_quoted_price' => $quote->quoted_price,
                'awarded_at' => now(),
            ]);

            // Reject all other quotes
            VendorQuote::where('sourcing_request_id', $sourcingId)
                ->where('id', '!=', $quoteId)
                ->where('status', 'submitted')
                ->update(['status' => 'rejected']);

            return response()->json([
                'success' => true,
                'message' => 'Quote accepted successfully',
                'data' => [
                    'sourcing_id' => $sourcing->id,
                    'status' => $sourcing->status,
                    'assigned_vendor' => $sourcing->assigned_vendor_name,
                    'final_price' => $sourcing->final_quoted_price,
                    'awarded_at' => $sourcing->awarded_at->toIso8601String(),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to accept quote',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Auto-select suitable vendors based on requirements
     */
    private function autoSelectVendors(VendorSourcing $sourcing): void
    {
        $requirements = $sourcing->requirements;
        
        // Find vendors based on material and quality requirements
        $vendors = Vendor::where('status', 'active')
            ->where(function ($query) use ($requirements) {
                if (!empty($requirements['material'])) {
                    $query->whereJsonContains('specializations', $requirements['material']);
                }
            })
            ->limit(5) // Select top 5 vendors
            ->get();

        // Create quote requests for selected vendors
        foreach ($vendors as $vendor) {
            VendorQuote::create([
                'uuid' => Str::uuid(),
                'sourcing_request_id' => $sourcing->id,
                'vendor_id' => $vendor->id,
                'status' => 'pending',
            ]);
        }
    }
}