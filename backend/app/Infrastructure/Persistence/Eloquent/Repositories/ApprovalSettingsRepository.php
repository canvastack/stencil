<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\CustomerQuote\Repositories\ApprovalSettingsRepositoryInterface;
use App\Domain\CustomerQuote\ValueObjects\ApprovalSettings as ApprovalSettingsVO;
use App\Infrastructure\Persistence\Eloquent\Models\ApprovalSettings;
use Illuminate\Support\Facades\Cache;

/**
 * Eloquent implementation of ApprovalSettingsRepositoryInterface
 * 
 * Implements caching for approval settings to reduce database queries
 */
class ApprovalSettingsRepository implements ApprovalSettingsRepositoryInterface
{
    private const CACHE_TTL = 3600; // 1 hour
    private const CACHE_PREFIX = 'approval_settings:';

    public function __construct(
        private ApprovalSettings $model
    ) {}

    public function getByTenantId(int $tenantId): ?ApprovalSettingsVO
    {
        $cacheKey = self::CACHE_PREFIX . $tenantId;

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($tenantId) {
            $settings = $this->model->where('tenant_id', $tenantId)->first();
            
            if (!$settings) {
                return null;
            }

            return ApprovalSettingsVO::fromArray([
                'auto_approval_enabled' => (bool) $settings->auto_approval_enabled,
                'auto_approval_threshold' => (int) $settings->auto_approval_threshold,
                'require_email_verification' => (bool) $settings->require_email_verification,
                'min_successful_orders' => (int) $settings->min_successful_orders,
                'min_payment_success_rate' => (float) $settings->min_payment_success_rate,
                'auto_approve_standard_products' => (bool) ($settings->auto_approve_standard_products ?? true),
                'require_approval_custom_products' => (bool) $settings->require_approval_for_custom,
                'max_negotiation_rounds' => (int) $settings->max_negotiation_rounds,
                'allow_customer_counter_offer' => (bool) $settings->allow_customer_counter_offer,
                'notify_admin_on_auto_approve' => (bool) $settings->notify_admin_on_auto_approve,
                'notify_admin_on_pending_approval' => (bool) $settings->notify_admin_on_pending_approval,
            ]);
        });
    }

    public function save(int $tenantId, ApprovalSettingsVO $settings): void
    {
        // Clear cache when settings are updated
        $this->clearCache($tenantId);
        
        // For now, Application layer saves directly via Eloquent
    }

    public function hasCustomSettings(int $tenantId): bool
    {
        return $this->model->where('tenant_id', $tenantId)->exists();
    }

    public function delete(int $tenantId): void
    {
        $this->model->where('tenant_id', $tenantId)->delete();
        
        // Clear cache when settings are deleted
        $this->clearCache($tenantId);
    }

    public function getDefault(): ApprovalSettingsVO
    {
        // Return default settings as value object
        return new ApprovalSettingsVO(
            autoApprovalEnabled: true,
            autoApprovalThreshold: 1000000000, // 10 million IDR in cents
            requireEmailVerification: true,
            minSuccessfulOrders: 1,
            minPaymentSuccessRate: 80.00,
            autoApproveStandardProducts: true,
            requireApprovalForCustom: true,
            maxNegotiationRounds: 3,
            allowCustomerCounterOffers: true,
            notifyAdminOnAutoApprove: false,
            notifyAdminOnPendingApproval: true
        );
    }

    /**
     * Clear cache for specific tenant
     */
    private function clearCache(int $tenantId): void
    {
        $cacheKey = self::CACHE_PREFIX . $tenantId;
        Cache::forget($cacheKey);
    }

    /**
     * Clear all approval settings cache
     */
    public function clearAllCache(): void
    {
        // This would require tracking all tenant IDs or using cache tags
        // For now, individual cache clearing is sufficient
    }
}


