<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Application\CustomerQuote\Services\DocumentGenerationService;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\OrderDocument;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Vendor Purchase Order Controller
 * 
 * Handles vendor-side purchase order operations:
 * - View purchase orders
 * - Acknowledge PO receipt
 * - Download PO documents
 * 
 * Requirements: 20.5, 20.6, 20.7
 */
class VendorPurchaseOrderController extends Controller
{
    public function __construct(
        private DocumentGenerationService $documentService
    ) {
        $this->middleware('auth:sanctum');
        $this->middleware('vendor.access');
    }

    /**
     * List all purchase orders for authenticated vendor
     * 
     * GET /api/vendor/purchase-orders
     * 
     * Requirements: 20.5
     */
    public function index(Request $request): JsonResponse
    {
        $vendor = Auth::user()->vendor;

        if (!$vendor) {
            return response()->json([
                'message' => 'Vendor profile not found'
            ], 404);
        }

        $query = OrderDocument::where('document_type', 'purchase_order')
            ->where('recipient_type', 'vendor')
            ->where('recipient_id', $vendor->id)
            ->with(['order.customer', 'order.customerQuote'])
            ->latest();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
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
     * Get specific purchase order details
     * 
     * GET /api/vendor/purchase-orders/{uuid}
     * 
     * Requirements: 20.5
     */
    public function show(string $uuid): JsonResponse
    {
        $vendor = Auth::user()->vendor;

        if (!$vendor) {
            return response()->json([
                'message' => 'Vendor profile not found'
            ], 404);
        }

        $purchaseOrder = OrderDocument::where('uuid', $uuid)
            ->where('document_type', 'purchase_order')
            ->where('recipient_type', 'vendor')
            ->where('recipient_id', $vendor->id)
            ->with([
                'order.customer',
                'order.customerQuote.vendorQuote',
                'order.tenant',
                'generatedBy',
                'sentBy',
                'acknowledgedBy'
            ])
            ->firstOrFail();

        // Log access
        $purchaseOrder->logAccess(Auth::id(), 'view');

        return response()->json([
            'data' => $purchaseOrder
        ]);
    }

    /**
     * Acknowledge purchase order receipt
     * 
     * POST /api/vendor/purchase-orders/{uuid}/acknowledge
     * 
     * Requirements: 20.7
     */
    public function acknowledge(Request $request, string $uuid): JsonResponse
    {
        $request->validate([
            'notes' => 'nullable|string|max:1000',
        ]);

        $vendor = Auth::user()->vendor;

        if (!$vendor) {
            return response()->json([
                'message' => 'Vendor profile not found'
            ], 404);
        }

        // Verify PO belongs to this vendor
        $purchaseOrder = OrderDocument::where('uuid', $uuid)
            ->where('document_type', 'purchase_order')
            ->where('recipient_type', 'vendor')
            ->where('recipient_id', $vendor->id)
            ->firstOrFail();

        try {
            $acknowledgedPO = $this->documentService->acknowledgePurchaseOrder(
                $uuid,
                Auth::id(),
                $request->notes
            );

            return response()->json([
                'message' => 'Purchase order acknowledged successfully',
                'data' => $acknowledgedPO
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => $e->getMessage()
            ], 422);
        }
    }

    /**
     * Download purchase order PDF
     * 
     * GET /api/vendor/purchase-orders/{uuid}/download
     * 
     * Requirements: 20.10
     */
    public function download(string $uuid)
    {
        $vendor = Auth::user()->vendor;

        if (!$vendor) {
            return response()->json([
                'message' => 'Vendor profile not found'
            ], 404);
        }

        $purchaseOrder = OrderDocument::where('uuid', $uuid)
            ->where('document_type', 'purchase_order')
            ->where('recipient_type', 'vendor')
            ->where('recipient_id', $vendor->id)
            ->firstOrFail();

        // Log access
        $purchaseOrder->logAccess(Auth::id(), 'download');

        // Return file download
        return response()->download(
            storage_path('app/' . $purchaseOrder->file_path),
            $purchaseOrder->document_number . '.pdf'
        );
    }
}
