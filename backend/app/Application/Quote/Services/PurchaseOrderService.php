<?php

namespace App\Application\Quote\Services;

use App\Mail\Vendor\PurchaseOrderNotification;
use App\Models\VendorPurchaseOrder;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;

/**
 * Purchase Order Service
 * 
 * Handles purchase order operations including PDF generation,
 * email delivery, and status management.
 */
class PurchaseOrderService
{
    /**
     * Generate PDF for purchase order
     * 
     * @param VendorPurchaseOrder $po
     * @return string|null PDF path
     */
    public function generatePdf(VendorPurchaseOrder $po): ?string
    {
        try {
            Log::info('[PO Service] PDF generation started', [
                'po_uuid' => $po->uuid,
                'po_number' => $po->po_number,
            ]);

            // Load relationships needed for PDF
            $po->load(['order', 'quote', 'vendor', 'creator']);

            // Parse order items from JSON
            $items = $this->parseOrderItems($po->order);

            // Generate PDF using DomPDF
            $pdf = Pdf::loadView('pdf.purchase-orders.standard', [
                'po' => $po,
                'items' => $items,
            ]);

            // Configure PDF options
            $pdf->setPaper('a4', 'portrait');
            $pdf->setOption('isHtml5ParserEnabled', true);
            $pdf->setOption('isRemoteEnabled', true);

            // Generate filename
            $filename = sprintf(
                'purchase-orders/%s/%s.pdf',
                $po->tenant_id,
                $po->po_number
            );

            // Save PDF to storage
            $pdfContent = $pdf->output();
            Storage::disk(config('purchase-order.storage_disk', 'local'))
                ->put($filename, $pdfContent);

            // Update PO record with PDF path
            $po->update([
                'pdf_path' => $filename,
                'pdf_generated_at' => now(),
            ]);

            Log::info('[PO Service] PDF generation completed', [
                'po_uuid' => $po->uuid,
                'pdf_path' => $filename,
                'file_size' => strlen($pdfContent),
            ]);

            return $filename;
        } catch (\Exception $e) {
            Log::error('[PO Service] PDF generation failed', [
                'po_uuid' => $po->uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return null;
        }
    }

    /**
     * Parse order items from JSON
     * 
     * @param \App\Models\Order $order
     * @return array
     */
    private function parseOrderItems($order): array
    {
        if (!$order || !$order->items) {
            return [];
        }

        $items = is_string($order->items) 
            ? json_decode($order->items, true) 
            : $order->items;

        return is_array($items) ? $items : [];
    }

    /**
     * Send purchase order to vendor via email
     * 
     * @param VendorPurchaseOrder $po
     * @return bool Success status
     */
    public function sendToVendor(VendorPurchaseOrder $po): bool
    {
        try {
            Log::info('[PO Service] Email sending requested', [
                'po_uuid' => $po->uuid,
                'vendor_id' => $po->vendor_id,
            ]);

            // Ensure PDF is generated
            if (!$po->pdf_path || !Storage::disk(config('purchase-order.storage_disk', 'local'))->exists($po->pdf_path)) {
                Log::info('[PO Service] PDF not found, generating now', [
                    'po_uuid' => $po->uuid,
                ]);
                $this->generatePdf($po);
                $po->refresh();
            }

            // Load vendor relationship
            $po->load('vendor');

            // Get vendor email
            $vendorEmail = $po->vendor->email;
            if (!$vendorEmail) {
                throw new \Exception('Vendor email not found');
            }

            // Send email with PDF attachment
            Mail::to($vendorEmail)->send(new PurchaseOrderNotification($po));

            // Update status to sent
            $po->update([
                'status' => 'sent',
                'sent_at' => now(),
            ]);

            Log::info('[PO Service] Email sent successfully', [
                'po_uuid' => $po->uuid,
                'vendor_email' => $vendorEmail,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('[PO Service] Email sending failed', [
                'po_uuid' => $po->uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return false;
        }
    }

    /**
     * Mark purchase order as accepted by vendor
     * 
     * @param VendorPurchaseOrder $po
     * @param int $acceptedBy User ID
     * @return bool Success status
     */
    public function markAsAccepted(VendorPurchaseOrder $po, int $acceptedBy): bool
    {
        try {
            $po->update([
                'status' => 'accepted',
                'accepted_at' => now(),
                'accepted_by' => $acceptedBy,
            ]);

            Log::info('[PO Service] Purchase order accepted', [
                'po_uuid' => $po->uuid,
                'accepted_by' => $acceptedBy,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('[PO Service] Failed to mark PO as accepted', [
                'po_uuid' => $po->uuid,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Cancel purchase order
     * 
     * @param VendorPurchaseOrder $po
     * @param string $reason Cancellation reason
     * @return bool Success status
     */
    public function cancel(VendorPurchaseOrder $po, string $reason): bool
    {
        try {
            $po->update([
                'status' => 'cancelled',
            ]);

            Log::info('[PO Service] Purchase order cancelled', [
                'po_uuid' => $po->uuid,
                'reason' => $reason,
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('[PO Service] Failed to cancel PO', [
                'po_uuid' => $po->uuid,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Get purchase order statistics for tenant
     * 
     * @param int $tenantId
     * @return array Statistics
     */
    public function getStatistics(int $tenantId): array
    {
        $total = VendorPurchaseOrder::forTenant($tenantId)->count();
        $draft = VendorPurchaseOrder::forTenant($tenantId)->withStatus('draft')->count();
        $sent = VendorPurchaseOrder::forTenant($tenantId)->withStatus('sent')->count();
        $accepted = VendorPurchaseOrder::forTenant($tenantId)->withStatus('accepted')->count();
        $completed = VendorPurchaseOrder::forTenant($tenantId)->withStatus('completed')->count();

        return [
            'total' => $total,
            'draft' => $draft,
            'sent' => $sent,
            'accepted' => $accepted,
            'completed' => $completed,
        ];
    }

    /**
     * Check if purchase order can be edited
     * 
     * @param VendorPurchaseOrder $po
     * @return bool
     */
    public function canEdit(VendorPurchaseOrder $po): bool
    {
        return in_array($po->status, ['draft']);
    }

    /**
     * Check if purchase order can be sent
     * 
     * @param VendorPurchaseOrder $po
     * @return bool
     */
    public function canSend(VendorPurchaseOrder $po): bool
    {
        return in_array($po->status, ['draft']);
    }

    /**
     * Check if purchase order can be cancelled
     * 
     * @param VendorPurchaseOrder $po
     * @return bool
     */
    public function canCancel(VendorPurchaseOrder $po): bool
    {
        return !in_array($po->status, ['completed', 'cancelled']);
    }
}
