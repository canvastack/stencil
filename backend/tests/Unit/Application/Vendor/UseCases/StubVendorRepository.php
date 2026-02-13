<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Stub for VendorRepository used in testing
 * This stub works with the database to provide realistic test scenarios
 */
class StubVendorRepository implements VendorRepositoryInterface
{
    public function findByUserId(int $userId, int $tenantId): ?Vendor
    {
        // Find user first to get vendor_id (UUID)
        $user = \App\Models\User::where('id', $userId)
            ->where('tenant_id', $tenantId)
            ->where('account_type', 'vendor')
            ->first();
            
        if (!$user || !$user->vendor_id) {
            return null;
        }
        
        // Then find vendor by UUID
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::where('uuid', $user->vendor_id)
            ->where('tenant_id', $tenantId)
            ->first();
            
        if (!$vendor) {
            return null;
        }
        
        // Create a mock vendor entity with canAccessPortal method
        // Since Vendor entity has private constructor, we use an anonymous class
        return new class($vendor) {
            private $vendorModel;
            
            public function __construct($vendorModel) {
                $this->vendorModel = $vendorModel;
            }
            
            public function canAccessPortal(): bool {
                return $this->vendorModel->portal_access_enabled && 
                       $this->vendorModel->status === 'active' &&
                       $this->vendorModel->onboarding_status === 'completed';
            }
        };
    }

    // Stub implementations for other interface methods
    public function save(Vendor $vendor): Vendor { return $vendor; }
    public function findById(UuidValueObject $id): ?Vendor { return null; }
    public function findByEmail(UuidValueObject $tenantId, string $email): ?Vendor { return null; }
    public function findByStatus(UuidValueObject $tenantId, string $status): array { return []; }
    public function findByCapability(UuidValueObject $tenantId, string $capability): array { return []; }
    public function existsByEmail(UuidValueObject $tenantId, string $email): bool { return false; }
    public function findWithFilters(UuidValueObject $tenantId, array $filters = [], int $page = 1, int $perPage = 15, string $sortBy = 'created_at', string $sortDirection = 'desc'): array { return []; }
    public function countWithFilters(UuidValueObject $tenantId, array $filters = []): int { return 0; }
    public function delete(UuidValueObject $id): bool { return false; }
    public function getStatistics(UuidValueObject $tenantId): array { return []; }
    public function findTopRated(UuidValueObject $tenantId, int $limit = 10): array { return []; }
    public function search(UuidValueObject $tenantId, string $searchTerm): array { return []; }
    public function getRecent(UuidValueObject $tenantId, int $limit = 10): array { return []; }
    public function findWithCapabilities(UuidValueObject $tenantId, array $capabilities): array { return []; }
    public function getPerformanceMetrics(UuidValueObject $tenantId): array { return []; }
    public function findAvailableVendors(UuidValueObject $tenantId): array { return []; }
    public function getOrderCount(UuidValueObject $vendorId): int { return 0; }
    public function findByRatingRange(UuidValueObject $tenantId, float $minRating, float $maxRating): array { return []; }
    public function findActiveVendors(): array { return []; }
    public function findWithPortalAccess(UuidValueObject $tenantId): array { return []; }
    public function findByOnboardingStatus(UuidValueObject $tenantId, string $onboardingStatus): array { return []; }
    public function updatePortalAccessTimestamp(UuidValueObject $vendorId): bool { return true; }
    public function getPortalPerformanceMetrics(UuidValueObject $vendorId): array { return []; }
}
