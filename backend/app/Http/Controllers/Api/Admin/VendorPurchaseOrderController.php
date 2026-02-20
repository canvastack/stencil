<?php

namespace App\Http\Controllers\Api\Admin;

use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Admin Vendor Purchase Order Controller
 * 
 * Handles admin-side vendor PO operations:
 * - Generate vendor PO
 * - Send PO to vendor
 * - Track PO status
 * - Revise PO
 * 
 * Requirements: 20.1, 20.2, 20.4, 20.6, 20.8, 20.9
 */
class VendorPurchaseOrderController extends Controller
{
    public function __construct(
        private DocumentGenerationService $documentService
    ) {
        $this->middleware('auth:sanctum');
        $this->middleware('tenant.aware');
    }

    /**
     * Generate vendor purchase order
     * 
     * POST /api/admin/orders/{orderId}/vendor-purchase-order
     * 
     * Requirements: 20.1, 20.2
     */
    public function generate(int $orderId): JsonResponse
    {
        try {
            $order = Order::with(['customerQuote.vendorQuote.vendor'])
                ->findOrFail($orderId);

            // Check if PO already exists
            $existingPO = OrderDocument::where('order_id', $orderId)
                ->where('document_type', 'purchase_order')
                ->where('is_latest_version', true)
                ->first();

            if ($existingPO && $existingPO->status !== 'draft') {
                return response()->json([
                    'message' => 'Purchase order already exists for this order',
                    'data' => $existingPO
                ], 422);
            }

            $purchaseOrder = $this->documentService->generatePurchaseOrder(
                $orderId,
                Auth::id()
            );

            return response()->json([
                'message' => 'Vendor purchase order generated successfully',
                'data' => $purchaseOrder
            ], 201);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Send purchase order to vendor
     * 
     * POST /api/admin/vendor-purchase-orders/{uuid}/send
     * 
     * Requirements: 20.4
     */
    public function send(string $uuid): JsonResponse
    {
        try {
            $purchaseOrder = $this->documentService->sendPurchaseOrderToVendor(
                $uuid,
                Auth::id()
            );

            return response()->json([
                'message' => 'Purchase order sent to vendor successfully',
                'data' => $purchaseOrder
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Get purchase order details
     * 
     * GET /api/admin/vendor-purchase-orders/{uuid}
     * 
     * Requirements: 20.6, 20.9
     */
    public function show(string $uuid): JsonResponse
    {
        $purchaseOrder = OrderDocument::where('uuid', $uuid)
            ->where('document_type', 'purchase_order')
            ->with([
                'order.customer',
                'order.customerQuote.vendorQuote.vendor',
                'generatedBy',
                'sentBy',
                'acknowledgedBy',
                'childDocuments' // For revision history
            ])
            ->firstOrFail();

        return response()->json([
            'data' => $purchaseOrder
        ]);
    }

    /**
     * List all purchase orders
     * 
     * GET /api/admin/vendor-purchase-orders
     * 
     * Requirements: 20.6
     */
    public function index(Request $request): JsonResponse
    {
        $query = OrderDocument::where('document_type', 'purchase_order')
            ->with(['order.customer', 'order.customerQuote.vendorQuote.vendor'])
            ->latest();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by vendor
        if ($request->has('vendor_id')) {
            $query->where('recipient_id', $request->vendor_id)
                ->where('recipient_type', 'vendor');
        }

        // Only latest versions by default
        if (!$request->has('include_revisions')) {
            $query->where('is_latest_version', true);
        }

        $purchaseOrders = $query->paginate(15);

        return response()->json([
            'data' => $purchaseOrders->items(),
            'meta' => [
                'current_page' => $purchaseOrders->currentPage(),
                'last_page' => $purchaseOrders->lastPage(),
                'per_page' => $purchaseOrders->perPage(),
                'total' => $purchaseOrders->total(),
            ]
        ]);
    }

    /**
     * Revise purchase order (creates new version)
     * 
     * POST /api/admin/vendor-purchase-orders/{uuid}/revise
     * 
     * Requirements: 20.8, 20.9
     */
    public function revise(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'revision_notes' => 'required|string|min:10|max:1000',
        ]);

        try {
            $originalPO = OrderDocument::where('uuid', $uuid)
                ->where('document_type', 'purchase_order')
                ->firstOrFail();

            // Mark original as not latest
            $originalPO->update(['is_latest_version' => false]);

            // Generate new version
            $revisedPO = $this->documentService->generatePurchaseOrder(
                $originalPO->order_id,
                Auth::id()
            );

            // Link to parent and increment version
            $revisedPO->update([
                'parent_document_id' => $originalPO->id,
                'version' => $originalPO->version + 1,
                'metadata' => array_merge($revisedPO->metadata ?? [], [
                    'revision_notes' => $request->revision_notes,
                    'revised_from' => $originalPO->uuid,
                ]),
            ]);

            return response()->json([
                'message' => 'Purchase order revised successfully',
                'data' => $revisedPO
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to revise purchase order: ' . $e->getMessage()
            ], 422);
        }
    }

    /**
     * Download purchase order PDF
     * 
     * GET /api/admin/vendor-purchase-orders/{uuid}/download
     * 
     * Requirements: 20.10
     */
    public function download(string $uuid)
    {
        $purchaseOrder = OrderDocument::where('uuid', $uuid)
            ->where('document_type', 'purchase_order')
            ->firstOrFail();

        // Log access
        $purchaseOrder->logAccess(Auth::id(), 'download');

        // Return file download
        return response()->download(
            storage_path('app/' . $purchaseOrder->file_path),
            $purchaseOrder->document_number . '.pdf'
        );
    }

    /**
     * Get acknowledgment tracking statistics
     * 
     * GET /api/admin/vendor-purchase-orders/acknowledgment-stats
     * 
     * Requirements: 20.7 - Track vendor acknowledgment
     */
    public function acknowledgmentStats(Request $request): JsonResponse
    {
        $tenantId = Auth::user()->tenant_id;
        
        $query = OrderDocument::withoutGlobalScope('tenant')
            ->where('document_type', 'purchase_order')
            ->where('tenant_id', $tenantId);

        // Filter by date range if provided
        if ($request->has('from_date')) {
            $query->where('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->where('created_at', '<=', $request->to_date);
        }

        $total = $query->count();
        $sent = (clone $query)->where('status', 'sent')->count();
        $acknowledged = (clone $query)->where('status', 'acknowledged')->count();
        $pending = $sent; // Sent but not acknowledged

        // Calculate average acknowledgment time
        $acknowledgedPOs = (clone $query)
            ->where('status', 'acknowledged')
            ->whereNotNull('sent_at')
            ->whereNotNull('acknowledged_at')
            ->get();

        $avgAcknowledgmentHours = 0;
        if ($acknowledgedPOs->count() > 0) {
            $totalHours = $acknowledgedPOs->sum(function ($po) {
                return $po->sent_at->diffInHours($po->acknowledged_at);
            });
            $avgAcknowledgmentHours = round($totalHours / $acknowledgedPOs->count(), 2);
        }

        // Get unacknowledged POs (sent more than 24 hours ago)
        $unacknowledgedPOs = OrderDocument::withoutGlobalScope('tenant')
            ->where('document_type', 'purchase_order')
            ->where('tenant_id', $tenantId)
            ->where('status', 'sent')
            ->where('sent_at', '<', now()->subHours(24))
            ->with([
                'order' => function ($query) {
                    $query->withoutGlobalScope('tenant');
                },
                'order.customer',
                'order.customerQuote' => function ($query) {
                    $query->withoutGlobalScope('tenant');
                },
                'order.customerQuote.vendorQuote' => function ($query) {
                    $query->withoutGlobalScope('tenant');
                },
                'order.customerQuote.vendorQuote.vendor'
            ])
            ->get();

        return response()->json([
            'data' => [
                'total_pos' => $total,
                'sent' => $sent,
                'acknowledged' => $acknowledged,
                'pending_acknowledgment' => $pending,
                'acknowledgment_rate' => $total > 0 ? round(($acknowledged / $total) * 100, 2) : 0,
                'avg_acknowledgment_hours' => $avgAcknowledgmentHours,
                'overdue_acknowledgments' => $unacknowledgedPOs->count(),
                'unacknowledged_pos' => $unacknowledgedPOs->map(function ($po) {
                    return [
                        'uuid' => $po->uuid,
                        'document_number' => $po->document_number,
                        'vendor_name' => $po->order->customerQuote->vendorQuote->vendor->name ?? 'Unknown',
                        'order_number' => $po->order->order_number,
                        'sent_at' => $po->sent_at,
                        'hours_since_sent' => $po->sent_at->diffInHours(now()),
                    ];
                }),
            ]
        ]);
    }
}
