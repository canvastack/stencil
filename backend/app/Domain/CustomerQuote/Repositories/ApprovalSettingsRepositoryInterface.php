<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Repositories;

use App\Domain\CustomerQuote\ValueObjects\ApprovalSettings;

/**
 * ApprovalSettingsRepositoryInterface
 * 
 * Repository interface (port) for ApprovalSettings persistence.
 * Implementation will be in Infrastructure layer.
 */
interface ApprovalSettingsRepositoryInterface
{
    /**
     * Get approval settings for tenant
     */
    public function getByTenantId(int $tenantId): ?ApprovalSettings;

    /**
     * Save approval settings for tenant
     */
    public function save(int $tenantId, ApprovalSettings $settings): void;

    /**
     * Check if tenant has custom settings
     */
    public function hasCustomSettings(int $tenantId): bool;

    /**
     * Delete approval settings for tenant (revert to defaults)
     */
    public function delete(int $tenantId): void;

    /**
     * Get default approval settings
     */
    public function getDefault(): ApprovalSettings;
}
