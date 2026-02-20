<?php

namespace App\Listeners;

use App\Events\VendorPurchaseOrderAcknowledged;
use App\Mail\Admin\VendorAcknowledgedPurchaseOrderMail;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

/**
 * Notify admin when vendor acknowledges purchase order
 * 
 * Requirements: 20.7 - Track vendor acknowledgment
 */
class NotifyAdminOfVendorAcknowledgment implements ShouldQueue
{
    /**
     * The name of the queue connection to use
     */
    public $connection = 'sync';

    /**
     * Handle the event
     */
    public function handle(VendorPurchaseOrderAcknowledged $event): void
    {
        try {
            $purchaseOrder = $event->purchaseOrder;
            
            // Load relationships
            $purchaseOrder->load([
                'order.customer',
                'order.customerQuote.vendorQuote.vendor',
                'acknowledgedBy'
            ]);

            // Get tenant admins (users with tenant account type)
            $admins = User::where('tenant_id', $purchaseOrder->tenant_id)
                ->where('account_type', 'tenant')
                ->get();

            // Send notification to each admin
            foreach ($admins as $admin) {
                Mail::to($admin->email)
                    ->queue(new VendorAcknowledgedPurchaseOrderMail(
                        $purchaseOrder,
                        $admin,
                        $event->notes
                    ));
            }

            Log::info('Vendor acknowledgment notifications sent', [
                'purchase_order_id' => $purchaseOrder->id,
                'vendor_user_id' => $event->vendorUserId,
                'admin_count' => $admins->count(),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to send vendor acknowledgment notifications', [
                'purchase_order_id' => $event->purchaseOrder->id,
                'error' => $e->getMessage(),
            ]);
            
            // Don't throw - we don't want to fail the acknowledgment
        }
    }
}
