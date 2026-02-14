<?php

declare(strict_types=1);

namespace App\Domain\Quote\Listeners;

use App\Domain\Quote\Events\VendorRespondedToQuote;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

/**
 * SendAdminQuoteAcceptedNotification Listener
 * 
 * Listens to VendorRespondedToQuote event and sends notifications to admins
 * when a vendor accepts a quote.
 * 
 * This is part of the post-acceptance workflow integration that ensures
 * admins are immediately notified when a vendor accepts a quote so they
 * can take the next steps in the order workflow.
 * 
 * Requirements: US-5 (Admin Notifications)
 */
class SendAdminQuoteAcceptedNotification implements ShouldQueue
{
    use InteractsWithQueue;

    /**
     * Determine if the listener should be queued.
     */
    public function shouldQueue(): bool
    {
        // Don't queue in testing environment to avoid tenant issues
        return !app()->environment('testing');
    }

    /**
     * Handle the event
     */
    public function handle(VendorRespondedToQuote $event): void
    {
        // Only handle acceptance responses
        if ($event->responseType !== 'accept') {
            return;
        }

        try {
            $quote = $event->quote;

            // Load vendor from database
            $vendor = Vendor::where('id', $quote->getVendorId())
                ->where('tenant_id', $quote->getTenantId())
                ->first();

            if (!$vendor) {
                Log::warning('Vendor not found for quote acceptance notification', [
                    'quote_uuid' => $quote->getUuid(),
                    'vendor_id' => $quote->getVendorId()
                ]);
                return;
            }

            // Load order from database
            $order = Order::where('id', $quote->getOrderId())
                ->where('tenant_id', $quote->getTenantId())
                ->first();

            if (!$order) {
                Log::warning('Order not found for quote acceptance notification', [
                    'quote_uuid' => $quote->getUuid(),
                    'order_id' => $quote->getOrderId()
                ]);
                return;
            }

            // Get all admin users for this tenant
            $admins = User::where('tenant_id', $quote->getTenantId())
                ->whereHas('roles', function ($query) {
                    $query->where('name', 'admin');
                })
                ->get();

            if ($admins->isEmpty()) {
                Log::warning('No admin users found for quote acceptance notification', [
                    'quote_uuid' => $quote->getUuid(),
                    'tenant_id' => $quote->getTenantId()
                ]);
                return;
            }

            // Get estimated delivery days from quote details
            $estimatedDeliveryDays = $quote->getQuoteDetails()['estimated_delivery_days'] ?? null;

            // Create notification data
            $notificationData = [
                'quote_uuid' => $quote->getUuid(),
                'quote_number' => "QT-{$quote->getId()}",
                'order_uuid' => $order->uuid,
                'order_number' => $order->order_number,
                'vendor_name' => $vendor->name,
                'vendor_uuid' => $vendor->uuid,
                'agreed_price' => $quote->getLatestOffer(),
                'currency' => $quote->getCurrency(),
                'estimated_delivery_days' => $estimatedDeliveryDays,
                'quote_url' => config('app.url') . "/admin/quotes/{$quote->getUuid()}",
                'order_url' => config('app.url') . "/admin/orders/{$order->uuid}",
                'accepted_at' => $quote->getRespondedAt()?->format('Y-m-d H:i:s'),
            ];

            // Send in-app notifications to all admins
            foreach ($admins as $admin) {
                $admin->notifications()->create([
                    'id' => \Illuminate\Support\Str::uuid(),
                    'type' => 'App\\Notifications\\QuoteAcceptedByVendorNotification',
                    'notifiable_type' => get_class($admin),
                    'notifiable_id' => $admin->id,
                    'data' => $notificationData,
                    'read_at' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            Log::info('Admin quote acceptance notifications sent successfully', [
                'quote_uuid' => $quote->getUuid(),
                'vendor_uuid' => $vendor->uuid,
                'order_uuid' => $order->uuid,
                'admin_count' => $admins->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to send admin quote acceptance notification', [
                'quote_uuid' => $event->quote->getUuid(),
                'response_type' => $event->responseType,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Handle a job failure
     */
    public function failed(VendorRespondedToQuote $event, \Throwable $exception): void
    {
        Log::error('Admin quote acceptance notification job failed permanently', [
            'quote_uuid' => $event->quote->getUuid(),
            'response_type' => $event->responseType,
            'error' => $exception->getMessage()
        ]);
    }
}
