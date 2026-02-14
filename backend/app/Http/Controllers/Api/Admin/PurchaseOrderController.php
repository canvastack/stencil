<?php

namespace App\Http\Controllers\Api\Admin;

use App\Application\Quote\Services\PurchaseOrderService;
use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Models\VendorPurchaseOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class PurchaseOrderController extends Controller
{
    public function __construct(
        private PurchaseOrderService $poService
    ) {}

    /**
     * Generate purchase order from accepted quote
     * 
     * POST /api/v1/admin/quotes/{quoteUuid}/generate-po
     */
    public function generateFromQuote(Request $request, string $quoteUuid): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;

            // Find quote
            $quote = OrderVendorNegotiation::where('uuid', $quoteUuid)
                ->where('tenant_id', $tenantId)
                ->with(['order', 'vendor'])
                ->firstOrFail();

            // Validate quote is accepted
            if ($quote->status !== 'accepted') {
                return response()->json([
                    'message' => 'Quote must be accepted before generating PO',
                    'error' => 'QUOTE_NOT_ACCEPTED',
                ], 400);
            }

            // Check if PO already exists
            $existingPo = VendorPurchaseOrder::where('quote_id', $quote->id)
                ->where('tenant_id', $tenantId)
                ->first();

            if ($existingPo) {
                return response()->json([
                    'message' => 'Purchase order already exists for this quote',
                    'data' => [
                        'po_uuid' => $existingPo->uuid,
                        'po_number' => $existingPo->po_number,
                        'status' => $existingPo->status,
                        'pdf_url' => $existingPo->pdf_path 
                            ? route('tenant.purchase-orders.download', $existingPo->uuid)
                            : null,
                    ],
                ], 200);
            }

            DB::beginTransaction();

            try {
                // Generate PO number
                $poNumber = $this->generatePoNumber($tenantId);

                // Calculate pricing (all amounts in cents)
                $subtotal = $quote->latest_offer ?? $quote->initial_offer ?? 0;
                $discount = 0; // No discount by default
                $tax = (int) ($subtotal * 0.11); // 11% PPN (Indonesian VAT)
                $shipping = 0; // No shipping cost by default
                $grandTotal = $subtotal - $discount + $tax + $shipping;

                // Create purchase order
                $po = VendorPurchaseOrder::create([
                    'uuid' => Str::uuid(),
                    'tenant_id' => $tenantId,
                    'po_number' => $poNumber,
                    'order_id' => $quote->order_id,
                    'quote_id' => $quote->id,
                    'vendor_id' => $quote->vendor_id,
                    'created_by' => $request->user()->id,
                    'status' => 'draft',
                    'issue_date' => now()->toDateString(),
                    'validity_date' => now()->addDays(30)->toDateString(),
                    'expected_delivery_date' => isset($quote->quote_details['estimated_delivery_days'])
                        ? now()->addDays($quote->quote_details['estimated_delivery_days'])->toDateString()
                        : now()->addDays(14)->toDateString(), // Default 14 days
                    
                    // Pricing (all in cents)
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'shipping' => $shipping,
                    'grand_total' => $grandTotal,
                    
                    // Additional fields
                    'currency' => $quote->currency ?? 'IDR',
                    'payment_terms' => $request->input('payment_terms', 'Net 30'),
                    'delivery_terms' => $request->input('delivery_terms', 'FOB'),
                    'notes' => $request->input('notes'),
                ]);

                // Generate PDF
                $pdfPath = $this->poService->generatePdf($po);

                if (!$pdfPath) {
                    throw new \Exception('Failed to generate PDF');
                }

                // Optionally send to vendor
                if ($request->input('send_to_vendor', false)) {
                    $this->poService->sendToVendor($po);
                }

                DB::commit();

                Log::info('[PO Controller] Purchase order generated', [
                    'po_uuid' => $po->uuid,
                    'quote_uuid' => $quoteUuid,
                    'user_id' => $request->user()->id,
                ]);

                return response()->json([
                    'message' => 'Purchase order generated successfully',
                    'data' => [
                        'po_uuid' => $po->uuid,
                        'po_number' => $po->po_number,
                        'status' => $po->status,
                        'pdf_url' => route('tenant.purchase-orders.download', $po->uuid),
                        'sent_to_vendor' => $po->status === 'sent',
                    ],
                ], 201);
            } catch (\Exception $e) {
                DB::rollBack();
                throw $e;
            }
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Quote not found',
                'error' => 'QUOTE_NOT_FOUND',
            ], 404);
        } catch (\Exception $e) {
            Log::error('[PO Controller] Failed to generate PO', [
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to generate purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Download purchase order PDF
     * 
     * GET /api/v1/admin/purchase-orders/{uuid}/download
     */
    public function download(Request $request, string $uuid): mixed
    {
        try {
            $tenantId = $request->user()->tenant_id;

            $po = VendorPurchaseOrder::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->firstOrFail();

            if (!$po->pdf_path || !Storage::disk(config('purchase-order.storage_disk', 'local'))->exists($po->pdf_path)) {
                // Regenerate PDF if not found
                $this->poService->generatePdf($po);
                $po->refresh();
            }

            $disk = Storage::disk(config('purchase-order.storage_disk', 'local'));
            $filename = basename($po->pdf_path);

            return response()->streamDownload(function () use ($disk, $po) {
                echo $disk->get($po->pdf_path);
            }, $filename, [
                'Content-Type' => 'application/pdf',
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Purchase order not found',
                'error' => 'PO_NOT_FOUND',
            ], 404);
        } catch (\Exception $e) {
            Log::error('[PO Controller] Failed to download PO', [
                'po_uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to download purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send purchase order to vendor
     * 
     * POST /api/v1/admin/purchase-orders/{uuid}/send
     */
    public function sendToVendor(Request $request, string $uuid): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;

            $po = VendorPurchaseOrder::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->firstOrFail();

            if (!$this->poService->canSend($po)) {
                return response()->json([
                    'message' => 'Purchase order cannot be sent in current status',
                    'error' => 'INVALID_STATUS',
                ], 400);
            }

            $success = $this->poService->sendToVendor($po);

            if (!$success) {
                return response()->json([
                    'message' => 'Failed to send purchase order to vendor',
                    'error' => 'SEND_FAILED',
                ], 500);
            }

            return response()->json([
                'message' => 'Purchase order sent to vendor successfully',
                'data' => [
                    'po_uuid' => $po->uuid,
                    'status' => $po->fresh()->status,
                    'sent_at' => $po->fresh()->sent_at,
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Purchase order not found',
                'error' => 'PO_NOT_FOUND',
            ], 404);
        } catch (\Exception $e) {
            Log::error('[PO Controller] Failed to send PO', [
                'po_uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Failed to send purchase order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get purchase order details
     * 
     * GET /api/v1/admin/purchase-orders/{uuid}
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;

            $po = VendorPurchaseOrder::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->with(['order', 'quote', 'vendor', 'creator'])
                ->firstOrFail();

            return response()->json([
                'data' => [
                    'uuid' => $po->uuid,
                    'po_number' => $po->po_number,
                    'status' => $po->status,
                    'total_amount' => $po->grand_total, // Use grand_total instead of total_amount
                    'currency' => $po->currency ?? 'IDR', // Ensure currency is always set
                    'payment_terms' => $po->payment_terms,
                    'delivery_terms' => $po->delivery_terms,
                    'notes' => $po->notes,
                    'expected_delivery_date' => $po->expected_delivery_date?->toISOString(),
                    'pdf_url' => $po->pdf_path 
                        ? route('tenant.purchase-orders.download', $po->uuid)
                        : null,
                    'sent_at' => $po->sent_at?->toISOString(),
                    'accepted_at' => $po->accepted_at?->toISOString(),
                    'created_at' => $po->created_at->toISOString(),
                    'vendor' => [
                        'uuid' => $po->vendor->uuid,
                        'name' => $po->vendor->name,
                        'email' => $po->vendor->email,
                    ],
                    'order' => [
                        'uuid' => $po->order->uuid,
                        'order_number' => $po->order->order_number,
                    ],
                ],
            ], 200);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Purchase order not found',
                'error' => 'PO_NOT_FOUND',
            ], 404);
        }
    }

    /**
     * Generate unique PO number
     */
    private function generatePoNumber(int $tenantId): string
    {
        $prefix = 'PO';
        $date = now()->format('Ymd');
        
        // Get last PO number for today
        $lastPo = VendorPurchaseOrder::where('tenant_id', $tenantId)
            ->where('po_number', 'like', "{$prefix}-{$date}-%")
            ->orderBy('po_number', 'desc')
            ->first();

        if ($lastPo) {
            // Extract sequence number and increment
            $lastSequence = (int) substr($lastPo->po_number, -5);
            $sequence = $lastSequence + 1;
        } else {
            $sequence = 1;
        }

        return sprintf('%s-%s-%05d', $prefix, $date, $sequence);
    }
}

