<?php

namespace App\Services;

use App\Models\InstalledPlugin;
use App\Contracts\PluginRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class PluginApprovalService
{
    protected PluginRepositoryInterface $pluginRepository;
    protected PluginManager $pluginManager;
    protected PluginNotificationService $notificationService;

    public function __construct(
        PluginRepositoryInterface $pluginRepository,
        PluginManager $pluginManager,
        PluginNotificationService $notificationService
    ) {
        $this->pluginRepository = $pluginRepository;
        $this->pluginManager = $pluginManager;
        $this->notificationService = $notificationService;
    }

    public function approve(string $uuid, string $adminId, ?string $notes = null, ?Carbon $expiresAt = null): bool
    {
        $plugin = InstalledPlugin::where('uuid', $uuid)->firstOrFail();

        if (!$plugin->isPending()) {
            throw new \RuntimeException("Only pending plugins can be approved. Current status: {$plugin->status}");
        }

        DB::beginTransaction();

        try {
            $plugin->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $adminId,
                'approval_notes' => $notes,
                'expires_at' => $expiresAt,
            ]);

            // Try to install plugin (will skip if plugin folder doesn't exist)
            $this->pluginManager->installApprovedPlugin($plugin);

            // Check if plugin was actually installed
            $pluginPath = dirname(base_path()) . "/plugins/{$plugin->plugin_name}";
            if (is_dir($pluginPath)) {
                $plugin->update([
                    'status' => 'active',
                    'installed_at' => now(),
                    'installed_by' => $adminId,
                ]);
            } else {
                // Plugin folder not found, mark as approved but not installed
                $plugin->update([
                    'approval_notes' => ($notes ?? '') . "\n\nNote: Plugin files not available. Status set to 'approved' only.",
                ]);
            }

            DB::commit();

            $this->notificationService->notifyTenantOfApproval($plugin);

            Log::info('Plugin installation approved', [
                'plugin_uuid' => $uuid,
                'tenant_id' => $plugin->tenant_id,
                'approved_by' => $adminId,
                'expires_at' => $expiresAt?->toDateTimeString(),
            ]);

            return true;
        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Plugin approval failed', [
                'plugin_uuid' => $uuid,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    public function reject(string $uuid, string $adminId, string $reason): bool
    {
        $plugin = InstalledPlugin::where('uuid', $uuid)->firstOrFail();

        if (!$plugin->isPending()) {
            throw new \RuntimeException("Only pending plugins can be rejected. Current status: {$plugin->status}");
        }

        $plugin->update([
            'status' => 'rejected',
            'rejected_at' => now(),
            'rejected_by' => $adminId,
            'rejection_reason' => $reason,
        ]);

        $this->notificationService->notifyTenantOfRejection($plugin);

        Log::info('Plugin installation rejected', [
            'plugin_uuid' => $uuid,
            'tenant_id' => $plugin->tenant_id,
            'rejected_by' => $adminId,
            'reason' => $reason,
        ]);

        return true;
    }

    public function suspend(string $uuid, string $adminId, string $reason): bool
    {
        $plugin = InstalledPlugin::where('uuid', $uuid)->firstOrFail();

        if (!$plugin->isActive()) {
            throw new \RuntimeException("Only active plugins can be suspended. Current status: {$plugin->status}");
        }

        $plugin->update([
            'status' => 'suspended',
            'rejection_reason' => $reason,
            'rejected_by' => $adminId,
            'rejected_at' => now(),
        ]);

        $this->notificationService->notifyTenantOfSuspension($plugin);

        Log::info('Plugin suspended', [
            'plugin_uuid' => $uuid,
            'tenant_id' => $plugin->tenant_id,
            'suspended_by' => $adminId,
            'reason' => $reason,
        ]);

        return true;
    }

    public function extend(string $uuid, Carbon $newExpiryDate): bool
    {
        $plugin = InstalledPlugin::where('uuid', $uuid)->firstOrFail();

        if (!$plugin->isActive() && !$plugin->isExpired()) {
            throw new \RuntimeException("Only active or expired plugins can have expiry extended. Current status: {$plugin->status}");
        }

        $plugin->update([
            'expires_at' => $newExpiryDate,
            'expiry_notified_at' => null,
            'status' => 'active',
        ]);

        Log::info('Plugin expiry extended', [
            'plugin_uuid' => $uuid,
            'tenant_id' => $plugin->tenant_id,
            'new_expiry' => $newExpiryDate->toDateTimeString(),
        ]);

        return true;
    }

    public function checkExpiry(): void
    {
        $expiringSoon = InstalledPlugin::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now()->addDay())
            ->where('expires_at', '>', now())
            ->whereNull('expiry_notified_at')
            ->get();

        foreach ($expiringSoon as $plugin) {
            $this->notificationService->notifyTenantOfExpiringSoon($plugin);

            $plugin->update(['expiry_notified_at' => now()]);

            Log::info('Plugin expiry warning sent', [
                'plugin_uuid' => $plugin->uuid,
                'tenant_id' => $plugin->tenant_id,
                'expires_at' => $plugin->expires_at->toDateTimeString(),
            ]);
        }

        $expired = InstalledPlugin::where('status', 'active')
            ->whereNotNull('expires_at')
            ->where('expires_at', '<=', now())
            ->get();

        foreach ($expired as $plugin) {
            $plugin->update(['status' => 'expired']);

            $this->notificationService->notifyTenantOfExpiry($plugin);

            Log::info('Plugin expired', [
                'plugin_uuid' => $plugin->uuid,
                'tenant_id' => $plugin->tenant_id,
                'expired_at' => $plugin->expires_at->toDateTimeString(),
            ]);
        }
    }
}
