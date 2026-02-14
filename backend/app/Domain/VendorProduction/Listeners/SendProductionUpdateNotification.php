<?php

namespace App\Domain\VendorProduction\Listeners;

use App\Domain\VendorProduction\Events\ProductionUpdateCreated;
use App\Domain\VendorProduction\Notifications\ProductionUpdateNotification;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Spatie\Multitenancy\Jobs\TenantAware;

/**
 * Send Production Update Notification Listener
 * 
 * Sends notifications to admin users when vendor creates a production update.
 */
class SendProductionUpdateNotification implements ShouldQueue, TenantAware
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
    public function handle(ProductionUpdateCreated $event): void
    {
        try {
            Log::info('[ProductionUpdateNotification] Sending notifications', [
                'update_uuid' => $event->update->uuid,
                'po_number' => $event->purchaseOrder->po_number,
                'status' => $event->getStatus(),
                'tenant_id' => $event->getTenantId(),
            ]);

            // Get admin users for this tenant
            $adminUsers = $this->getAdminUsers($event->getTenantId());

            if ($adminUsers->isEmpty()) {
                Log::warning('[ProductionUpdateNotification] No admin users found', [
                    'tenant_id' => $event->getTenantId(),
                ]);
                return;
            }

            // Send notification to all admin users
            $notification = new ProductionUpdateNotification(
                $event->update,
                $event->purchaseOrder
            );

            Notification::send($adminUsers, $notification);

            Log::info('[ProductionUpdateNotification] Notifications sent', [
                'update_uuid' => $event->update->uuid,
                'admin_count' => $adminUsers->count(),
            ]);

        } catch (\Exception $e) {
            Log::error('[ProductionUpdateNotification] Failed to send notifications', [
                'update_uuid' => $event->update->uuid ?? null,
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
