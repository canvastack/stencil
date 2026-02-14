<?php

namespace App\Domain\VendorProduction\Listeners;

use App\Domain\VendorProduction\Events\ProductionCompleted;
use App\Domain\VendorProduction\Notifications\ProductionCompletedNotification;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Spatie\Multitenancy\Jobs\TenantAware;

/**
 * Send Production Completed Notification Listener
 * 
 * Sends notifications to admin users when vendor completes production.
 */
class SendProductionCompletedNotification implements ShouldQueue, TenantAware
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
     * Handle the event.
     */
    public function handle(ProductionCompleted $event): void
    {
        try {
            Log::info('[ProductionCompletedNotification] Sending notifications', [
                'po_uuid' => $event->purchaseOrder->uuid,
                'po_number' => $event->purchaseOrder->po_number,
                'is_on_time' => $event->isOnTime(),
                'tenant_id' => $event->getTenantId(),
            ]);

            // Get admin users for this tenant
            $adminUsers = $this->getAdminUsers($event->getTenantId());

            if ($adminUsers->isEmpty()) {
                Log::warning('[ProductionCompletedNotification] No admin users found', [
                    'tenant_id' => $event->getTenantId(),
                ]);
                return;
            }

            // Send notification to all admin users
            $notification = new ProductionCompletedNotification(
                $event->purchaseOrder,
                $event->finalUpdate
            );

            Notification::send($adminUsers, $notification);

            Log::info('[ProductionCompletedNotification] Notifications sent', [
                'po_uuid' => $event->purchaseOrder->uuid,
                'admin_count' => $adminUsers->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('[ProductionCompletedNotification] Failed to send notifications', [
                'po_uuid' => $event->purchaseOrder->uuid ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            
            // Re-throw to trigger retry mechanism
            throw $e;
        }
    }

    /**
     * Get admin users for the tenant
     */
    private function getAdminUsers(int $tenantId): \Illuminate\Support\Collection
    {
        return User::where('tenant_id', $tenantId)
            ->whereHas('roles', function ($query) {
                $query->whereIn('name', ['admin', 'order_manager', 'production_manager']);
            })
            ->get();
    }
}
