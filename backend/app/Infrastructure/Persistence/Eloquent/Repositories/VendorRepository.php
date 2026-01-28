<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor as VendorModel;
use Illuminate\Database\Eloquent\ModelNotFoundException;

/**
 * Vendor Repository Implementation (Adapter)
 * 
 * Implements vendor data persistence using Eloquent ORM.
 * Part of the Infrastructure layer - framework specific.
 * 
 * Database Integration:
 * - Maps to vendors table
 * - Handles UUID-based operations
 * - Maintains tenant isolation
 * - Converts between domain entities and Eloquent models
 */
class VendorRepository implements VendorRepositoryInterface
{
    /**
     * Save vendor (create or update)
     */
    public function save(Vendor $vendor): Vendor
    {
        $model = VendorModel::updateOrCreate(
            ['uuid' => $vendor->getId()->getValue()],
            [
                'tenant_id' => $vendor->getTenantId()->getValue(),
                'name' => $vendor->getName(),
                'email' => $vendor->getEmail(),
                'phone' => $vendor->getPhone(),
                'company' => $vendor->getCompany(),
                'address' => $vendor->getAddress() ? json_encode([
                    'street' => $vendor->getAddress()->getStreet(),
                    'city' => $vendor->getAddress()->getCity(),
                    'state' => $vendor->getAddress()->getState(),
                    'postal_code' => $vendor->getAddress()->getPostalCode(),
                    'country' => $vendor->getAddress()->getCountry(),
                ]) : null,
                'contact_info' => $vendor->getContactInfo() ? json_encode([
                    'email' => $vendor->getContactInfo()->getEmail(),
                    'phone' => $vendor->getContactInfo()->getPhone(),
                    'website' => $vendor->getContactInfo()->getWebsite(),
                    'social_media' => $vendor->getContactInfo()->getSocialMedia(),
                ]) : null,
                'capabilities' => json_encode($vendor->getCapabilities()),
                'certifications' => json_encode($vendor->getCertifications()),
                'rating' => $vendor->getRating(),
                'metadata' => json_encode($vendor->getMetadata()),
                'status' => $vendor->getStatus(),
                'created_at' => $vendor->getCreatedAt(),
                'updated_at' => $vendor->getUpdatedAt(),
            ]
        );

        return $this->toDomainEntity($model);
    }

    /**
     * Find vendor by UUID
     */
    public function findById(UuidValueObject $id): ?Vendor
    {
        $model = VendorModel::where('uuid', $id->getValue())->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find vendor by email within tenant
     */
    public function findByEmail(UuidValueObject $tenantId, string $email): ?Vendor
    {
        $model = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('email', $email)
            ->first();
        
        return $model ? $this->toDomainEntity($model) : null;
    }

    /**
     * Find vendors by status within tenant
     */
    public function findByStatus(UuidValueObject $tenantId, string $status): array
    {
        $models = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('status', $status)
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find vendors by capability within tenant
     */
    public function findByCapability(UuidValueObject $tenantId, string $capability): array
    {
        $models = VendorModel::where('tenant_id', $tenantId->getValue())
            ->whereJsonContains('capabilities', $capability)
            ->get();
        
        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Check if vendor email exists within tenant
     */
    public function existsByEmail(UuidValueObject $tenantId, string $email): bool
    {
        return VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('email', $email)
            ->exists();
    }

    /**
     * Get paginated vendors with filters
     */
    public function findWithFilters(
        UuidValueObject $tenantId,
        array $filters = [],
        int $page = 1,
        int $perPage = 15,
        string $sortBy = 'created_at',
        string $sortDirection = 'desc'
    ): array {
        $query = VendorModel::where('tenant_id', $tenantId->getValue());

        // Apply filters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('company', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['capability'])) {
            $query->whereJsonContains('capabilities', $filters['capability']);
        }

        if (isset($filters['min_rating'])) {
            $query->where('rating', '>=', $filters['min_rating']);
        }

        if (isset($filters['max_rating'])) {
            $query->where('rating', '<=', $filters['max_rating']);
        }

        $models = $query->orderBy($sortBy, $sortDirection)
            ->skip(($page - 1) * $perPage)
            ->take($perPage)
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Count vendors with filters
     */
    public function countWithFilters(UuidValueObject $tenantId, array $filters = []): int
    {
        $query = VendorModel::where('tenant_id', $tenantId->getValue());

        // Apply same filters as findWithFilters
        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('email', 'ILIKE', '%' . $filters['search'] . '%')
                  ->orWhere('company', 'ILIKE', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['capability'])) {
            $query->whereJsonContains('capabilities', $filters['capability']);
        }

        if (isset($filters['min_rating'])) {
            $query->where('rating', '>=', $filters['min_rating']);
        }

        if (isset($filters['max_rating'])) {
            $query->where('rating', '<=', $filters['max_rating']);
        }

        return $query->count();
    }

    /**
     * Delete vendor (soft delete)
     */
    public function delete(UuidValueObject $id): bool
    {
        return VendorModel::where('uuid', $id->getValue())->delete() > 0;
    }

    /**
     * Get vendor statistics for tenant
     */
    public function getStatistics(UuidValueObject $tenantId): array
    {
        $total = VendorModel::where('tenant_id', $tenantId->getValue())->count();
        $active = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'active')
            ->count();
        $avgRating = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'active')
            ->avg('rating');

        return [
            'total' => $total,
            'active' => $active,
            'inactive' => $total - $active,
            'average_rating' => round($avgRating ?? 0, 2),
            'active_percentage' => $total > 0 ? round(($active / $total) * 100, 2) : 0,
        ];
    }

    /**
     * Find top-rated vendors for tenant
     */
    public function findTopRated(UuidValueObject $tenantId, int $limit = 10): array
    {
        $models = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'active')
            ->orderBy('rating', 'desc')
            ->limit($limit)
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Search vendors by term (name, company, email)
     */
    public function search(UuidValueObject $tenantId, string $searchTerm): array
    {
        $models = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where(function ($query) use ($searchTerm) {
                $query->where('name', 'ILIKE', '%' . $searchTerm . '%')
                      ->orWhere('email', 'ILIKE', '%' . $searchTerm . '%')
                      ->orWhere('company', 'ILIKE', '%' . $searchTerm . '%');
            })
            ->orderBy('rating', 'desc')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Get recent vendors for tenant
     */
    public function getRecent(UuidValueObject $tenantId, int $limit = 10): array
    {
        $models = VendorModel::where('tenant_id', $tenantId->getValue())
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find vendors with specific capabilities
     */
    public function findWithCapabilities(UuidValueObject $tenantId, array $capabilities): array
    {
        $query = VendorModel::where('tenant_id', $tenantId->getValue());

        foreach ($capabilities as $capability) {
            $query->whereJsonContains('capabilities', $capability);
        }

        $models = $query->orderBy('rating', 'desc')->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Get vendor performance metrics
     */
    public function getPerformanceMetrics(UuidValueObject $tenantId): array
    {
        $vendors = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'active')
            ->get();

        $totalVendors = $vendors->count();
        $avgRating = $vendors->avg('rating');
        $topRated = $vendors->where('rating', '>=', 4.5)->count();

        return [
            'total_active_vendors' => $totalVendors,
            'average_rating' => round($avgRating ?? 0, 2),
            'top_rated_count' => $topRated,
            'top_rated_percentage' => $totalVendors > 0 ? round(($topRated / $totalVendors) * 100, 2) : 0,
        ];
    }

    /**
     * Find vendors available for new orders
     */
    public function findAvailableVendors(UuidValueObject $tenantId): array
    {
        $models = VendorModel::where('tenant_id', $tenantId->getValue())
            ->where('status', 'active')
            ->orderBy('rating', 'desc')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Get vendor order count
     */
    public function getOrderCount(UuidValueObject $vendorId): int
    {
        // This would need to be implemented when Order model is available
        // For now, return 0
        return 0;
    }

    /**
     * Find vendors by rating range
     */
    public function findByRatingRange(
        UuidValueObject $tenantId,
        float $minRating,
        float $maxRating
    ): array {
        $models = VendorModel::where('tenant_id', $tenantId->getValue())
            ->whereBetween('rating', [$minRating, $maxRating])
            ->orderBy('rating', 'desc')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Find all active vendors across all tenants (for vendor matching)
     */
    public function findActiveVendors(): array
    {
        $models = VendorModel::where('status', 'active')
            ->orderBy('rating', 'desc')
            ->get();

        return $models->map(fn($model) => $this->toDomainEntity($model))->toArray();
    }

    /**
     * Convert Eloquent model to domain entity
     */
    private function toDomainEntity(VendorModel $model): Vendor
    {
        // Handle tenant_id conversion: database stores integer ID, domain expects UUID
        $tenantUuid = $model->tenant_id;
        if (is_numeric($tenantUuid)) {
            // Look up tenant UUID from integer ID
            $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::find($tenantUuid);
            $tenantUuid = $tenant ? $tenant->uuid : $tenantUuid;
        }

        return Vendor::reconstitute(
            id: new UuidValueObject($model->uuid),
            tenantId: new UuidValueObject($tenantUuid),
            name: $model->name,
            email: $model->email,
            phone: $model->phone,
            company: $model->company ?? 'Unknown Company',
            address: $model->address ? (is_string($model->address) ? json_decode($model->address, true) : $model->address) : null,
            contactInfo: $model->contact_info ? (is_string($model->contact_info) ? json_decode($model->contact_info, true) : $model->contact_info) : null,
            capabilities: is_string($model->capabilities) ? json_decode($model->capabilities, true) ?? [] : ($model->capabilities ?? []),
            certifications: is_string($model->certifications) ? json_decode($model->certifications, true) ?? [] : ($model->certifications ?? []),
            rating: $model->rating,
            metadata: is_string($model->metadata) ? json_decode($model->metadata, true) ?? [] : ($model->metadata ?? []),
            status: $model->status,
            createdAt: new \DateTimeImmutable($model->created_at->format('Y-m-d H:i:s')),
            updatedAt: new \DateTimeImmutable($model->updated_at->format('Y-m-d H:i:s'))
        );
    }
}