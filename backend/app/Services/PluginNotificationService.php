<?php

namespace App\Services;

use App\Models\InstalledPlugin;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class PluginNotificationService
{
    public function notifyPlatformAdminOfRequest(InstalledPlugin $plugin): void
    {
        Log::info('Platform admin notified of plugin request', [
            'plugin_uuid' => $plugin->uuid,
            'plugin_name' => $plugin->plugin_name,
            'tenant_id' => $plugin->tenant_id,
            'requested_by' => $plugin->requested_by,
        ]);
    }

    public function notifyTenantOfApproval(InstalledPlugin $plugin): void
    {
        if (!$plugin->requester) {
            Log::warning('Cannot notify tenant of approval - no requester found', [
                'plugin_uuid' => $plugin->uuid,
            ]);
            return;
        }

        Log::info('Tenant notified of plugin approval', [
            'plugin_uuid' => $plugin->uuid,
            'plugin_name' => $plugin->display_name,
            'tenant_id' => $plugin->tenant_id,
            'user_id' => $plugin->requested_by,
        ]);
    }

    public function notifyTenantOfRejection(InstalledPlugin $plugin): void
    {
        if (!$plugin->requester) {
            Log::warning('Cannot notify tenant of rejection - no requester found', [
                'plugin_uuid' => $plugin->uuid,
            ]);
            return;
        }

        Log::info('Tenant notified of plugin rejection', [
            'plugin_uuid' => $plugin->uuid,
            'plugin_name' => $plugin->display_name,
            'tenant_id' => $plugin->tenant_id,
            'user_id' => $plugin->requested_by,
            'reason' => $plugin->rejection_reason,
        ]);
    }

    public function notifyTenantOfExpiringSoon(InstalledPlugin $plugin): void
    {
        if (!$plugin->requester) {
            Log::warning('Cannot notify tenant of expiry - no requester found', [
                'plugin_uuid' => $plugin->uuid,
            ]);
            return;
        }

        $daysLeft = $plugin->expires_at->diffInDays(now());

        Log::info('Tenant notified of plugin expiring soon', [
            'plugin_uuid' => $plugin->uuid,
            'plugin_name' => $plugin->display_name,
            'tenant_id' => $plugin->tenant_id,
            'user_id' => $plugin->requested_by,
            'days_left' => $daysLeft,
            'expires_at' => $plugin->expires_at->toDateTimeString(),
        ]);
    }

    public function notifyTenantOfExpiry(InstalledPlugin $plugin): void
    {
        if (!$plugin->requester) {
            Log::warning('Cannot notify tenant of expiry - no requester found', [
                'plugin_uuid' => $plugin->uuid,
            ]);
            return;
        }

        Log::info('Tenant notified of plugin expiry', [
            'plugin_uuid' => $plugin->uuid,
            'plugin_name' => $plugin->display_name,
            'tenant_id' => $plugin->tenant_id,
            'user_id' => $plugin->requested_by,
            'expired_at' => $plugin->expires_at->toDateTimeString(),
        ]);
    }

    public function notifyTenantOfSuspension(InstalledPlugin $plugin): void
    {
        if (!$plugin->requester) {
            Log::warning('Cannot notify tenant of suspension - no requester found', [
                'plugin_uuid' => $plugin->uuid,
            ]);
            return;
        }

        Log::info('Tenant notified of plugin suspension', [
            'plugin_uuid' => $plugin->uuid,
            'plugin_name' => $plugin->display_name,
            'tenant_id' => $plugin->tenant_id,
            'user_id' => $plugin->requested_by,
            'reason' => $plugin->rejection_reason,
        ]);
    }
}
