<?php

namespace Tests\Integration\Infrastructure\Repositories;

use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorEloquentRepositoryTest extends TestCase
{
    use RefreshDatabase;

    private VendorRepositoryInterface $repository;
    private int $tenantId;
    private TenantEloquentModel $tenant;
    private Vendor $vendor;
    private UserEloquentModel $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = app(VendorRepositoryInterface::class);

        // Create tenant using factory
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->tenantId = $this->tenant->id;

        // Create test vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'status' => 'active',
        ]);

        // Create test user associated with vendor
        $this->user = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->uuid,
            'account_type' => 'vendor',
        ]);
    }

    /** @test */
    public function it_finds_vendor_by_user_id(): void
    {
        // Act
        $result = $this->repository->findByUserId($this->user->id, $this->tenantId);

        // Assert
        $this->assertNotNull($result);
        $this->assertEquals($this->vendor->uuid, $result->getId()->getValue());
        $this->assertEquals($this->vendor->name, $result->getName());
        $this->assertEquals($this->vendor->email, $result->getEmail());
    }

    /** @test */
    public function it_returns_null_when_user_has_no_vendor(): void
    {
        // Arrange
        $userWithoutVendor = UserEloquentModel::factory()->create([
            'tenant_id' => $this->tenantId,
            'vendor_id' => null,
            'account_type' => 'tenant',
        ]);

        // Act
        $result = $this->repository->findByUserId($userWithoutVendor->id, $this->tenantId);

        // Assert
        $this->assertNull($result);
    }

    /** @test */
    public function it_finds_vendors_with_portal_access(): void
    {
        // Arrange
        Vendor::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'portal_access_enabled' => true,
            'status' => 'active',
        ]);

        Vendor::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'portal_access_enabled' => false,
            'status' => 'active',
        ]);

        // Act
        $result = $this->repository->findWithPortalAccess(new UuidValueObject($this->tenant->uuid));

        // Assert - should find 4 vendors (3 new + 1 from setUp)
        $this->assertCount(4, $result);
        foreach ($result as $vendor) {
            $this->assertTrue($vendor->isPortalAccessEnabled());
            $this->assertTrue($vendor->isActive());
        }
    }

    /** @test */
    public function it_excludes_inactive_vendors_from_portal_access(): void
    {
        // Arrange
        Vendor::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'portal_access_enabled' => true,
            'status' => 'inactive',
        ]);

        // Act
        $result = $this->repository->findWithPortalAccess(new UuidValueObject($this->tenant->uuid));

        // Assert - should only find 1 vendor from setUp (active with portal access)
        $this->assertCount(1, $result);
    }

    /** @test */
    public function it_finds_vendors_by_onboarding_status(): void
    {
        // Arrange
        Vendor::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'onboarding_status' => 'pending',
        ]);

        Vendor::factory()->count(2)->create([
            'tenant_id' => $this->tenantId,
            'onboarding_status' => 'in_progress',
        ]);

        // Act
        $result = $this->repository->findByOnboardingStatus(
            new UuidValueObject($this->tenant->uuid),
            'pending'
        );

        // Assert
        $this->assertCount(3, $result);
        foreach ($result as $vendor) {
            $this->assertEquals('pending', $vendor->getOnboardingStatus());
        }
    }

    /** @test */
    public function it_updates_portal_access_timestamp(): void
    {
        // Arrange
        $vendorId = new UuidValueObject($this->vendor->uuid);
        $beforeUpdate = $this->vendor->portal_last_access_at;

        // Wait a moment to ensure timestamp difference
        sleep(1);

        // Act
        $result = $this->repository->updatePortalAccessTimestamp($vendorId);

        // Assert
        $this->assertTrue($result);
        
        // Refresh vendor from database
        $this->vendor->refresh();
        $this->assertNotNull($this->vendor->portal_last_access_at);
        
        if ($beforeUpdate) {
            $this->assertNotEquals(
                $beforeUpdate->format('Y-m-d H:i:s'),
                $this->vendor->portal_last_access_at->format('Y-m-d H:i:s')
            );
        }
    }

    /** @test */
    public function it_calculates_portal_performance_metrics(): void
    {
        // Arrange
        $vendorId = new UuidValueObject($this->vendor->uuid);

        // Create customer first (required for foreign key)
        $customerId = \Illuminate\Support\Facades\DB::table('customers')->insertGetId([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenantId,
            'name' => 'Test Customer',
            'email' => 'customer@test.com',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create orders (required for foreign key)
        $order1 = \Illuminate\Support\Facades\DB::table('orders')->insertGetId([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenantId,
            'customer_id' => $customerId,
            'order_number' => 'ORD-001',
            'status' => 'pending',
            'items' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $order2 = \Illuminate\Support\Facades\DB::table('orders')->insertGetId([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenantId,
            'customer_id' => $customerId,
            'order_number' => 'ORD-002',
            'status' => 'pending',
            'items' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $order3 = \Illuminate\Support\Facades\DB::table('orders')->insertGetId([
            'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
            'tenant_id' => $this->tenantId,
            'customer_id' => $customerId,
            'order_number' => 'ORD-003',
            'status' => 'pending',
            'items' => json_encode([]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Create some test quotes (order_vendor_negotiations)
        \Illuminate\Support\Facades\DB::table('order_vendor_negotiations')->insert([
            [
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $this->tenantId,
                'vendor_id' => $this->vendor->id,
                'order_id' => $order1,
                'status' => 'accepted',
                'created_at' => now()->subDays(5),
                'responded_at' => now()->subDays(4),
            ],
            [
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $this->tenantId,
                'vendor_id' => $this->vendor->id,
                'order_id' => $order2,
                'status' => 'rejected',
                'created_at' => now()->subDays(3),
                'responded_at' => now()->subDays(2),
            ],
            [
                'uuid' => \Ramsey\Uuid\Uuid::uuid4()->toString(),
                'tenant_id' => $this->tenantId,
                'vendor_id' => $this->vendor->id,
                'order_id' => $order3,
                'status' => 'sent',
                'created_at' => now()->subDays(1),
                'responded_at' => null,
            ],
        ]);

        // Act
        $metrics = $this->repository->getPortalPerformanceMetrics($vendorId);

        // Assert
        $this->assertIsArray($metrics);
        $this->assertEquals(3, $metrics['total_quotes']);
        $this->assertEquals(1, $metrics['accepted_quotes']);
        $this->assertEquals(1, $metrics['rejected_quotes']);
        $this->assertEquals(1, $metrics['pending_quotes']);
        $this->assertEquals(33.33, $metrics['acceptance_rate']); // 1/3 * 100
        $this->assertGreaterThan(0, $metrics['avg_response_time_hours']);
    }

    /** @test */
    public function it_saves_new_vendor(): void
    {
        // Arrange
        $newVendorUuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
        $address = new \App\Domain\Shared\ValueObjects\Address(
            street: '123 Test Street',
            city: 'Jakarta',
            state: 'DKI Jakarta',
            postalCode: '12345',
            country: 'ID' // ISO 3166-1 alpha-2 code
        );
        
        $vendorEntity = \App\Domain\Vendor\Entities\Vendor::create(
            tenantId: new UuidValueObject($this->tenant->uuid),
            name: 'New Test Vendor',
            email: 'newvendor@test.com',
            phone: '+62123456789',
            company: 'New Test Company',
            address: $address,
            capabilities: [],
            metadata: []
        );

        // Act
        $savedVendor = $this->repository->save($vendorEntity);

        // Assert
        $this->assertNotNull($savedVendor);
        $this->assertEquals('New Test Vendor', $savedVendor->getName());
        $this->assertEquals('newvendor@test.com', $savedVendor->getEmail());
        
        // Verify in database
        $this->assertDatabaseHas('vendors', [
            'name' => 'New Test Vendor',
            'email' => 'newvendor@test.com',
        ]);
    }

    /** @test */
    public function it_updates_existing_vendor(): void
    {
        // Arrange
        $vendorEntity = \App\Domain\Vendor\Entities\Vendor::reconstitute(
            id: new UuidValueObject($this->vendor->uuid),
            tenantId: new UuidValueObject($this->tenant->uuid),
            name: 'Updated Vendor Name',
            email: $this->vendor->email,
            phone: $this->vendor->phone,
            company: $this->vendor->company_name ?? 'Test Company',
            address: null,
            contactInfo: null,
            capabilities: [],
            certifications: [],
            rating: $this->vendor->rating ?? 0.0,
            metadata: [],
            status: $this->vendor->status,
            createdAt: new \DateTimeImmutable($this->vendor->created_at->format('Y-m-d H:i:s')),
            updatedAt: new \DateTimeImmutable(),
            onboardingStatus: $this->vendor->onboarding_status ?? 'pending',
            onboardingCompletedAt: null,
            portalAccessEnabled: $this->vendor->portal_access_enabled ?? false,
            portalLastAccessAt: null
        );

        // Act
        $updatedVendor = $this->repository->save($vendorEntity);

        // Assert
        $this->assertEquals('Updated Vendor Name', $updatedVendor->getName());
        
        // Verify in database
        $this->assertDatabaseHas('vendors', [
            'uuid' => $this->vendor->uuid,
            'name' => 'Updated Vendor Name',
        ]);
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        $otherTenant = TenantEloquentModel::factory()->create();
        $otherTenantId = $otherTenant->id;

        Vendor::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'portal_access_enabled' => true,
            'status' => 'active',
        ]);

        Vendor::factory()->count(2)->create([
            'tenant_id' => $otherTenantId,
            'portal_access_enabled' => true,
            'status' => 'active',
        ]);

        // Act
        $result = $this->repository->findWithPortalAccess(new UuidValueObject($this->tenant->uuid));

        // Assert - should only find vendors from this tenant (3 new + 1 from setUp)
        $this->assertCount(4, $result);
        foreach ($result as $vendor) {
            $this->assertEquals($this->tenant->uuid, $vendor->getTenantId()->getValue());
        }
    }

    /** @test */
    public function it_paginates_vendors_correctly(): void
    {
        // Arrange
        Vendor::factory()->count(25)->create([
            'tenant_id' => $this->tenantId,
            'status' => 'active',
        ]);

        // Act - Get first page
        $page1 = $this->repository->findWithFilters(
            tenantId: new UuidValueObject($this->tenant->uuid),
            filters: [],
            page: 1,
            perPage: 10
        );

        // Act - Get second page
        $page2 = $this->repository->findWithFilters(
            tenantId: new UuidValueObject($this->tenant->uuid),
            filters: [],
            page: 2,
            perPage: 10
        );

        // Assert
        $this->assertCount(10, $page1);
        $this->assertCount(10, $page2);
        
        // Ensure different vendors on each page
        $page1Ids = array_map(fn($v) => $v->getId()->getValue(), $page1);
        $page2Ids = array_map(fn($v) => $v->getId()->getValue(), $page2);
        $this->assertEmpty(array_intersect($page1Ids, $page2Ids));
    }

    /** @test */
    public function it_sorts_vendors_correctly(): void
    {
        // Arrange
        Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'name' => 'Alpha Vendor',
            'rating' => 4.5,
        ]);

        Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'name' => 'Zeta Vendor',
            'rating' => 3.5,
        ]);

        Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'name' => 'Beta Vendor',
            'rating' => 5.0,
        ]);

        // Act - Sort by name ascending
        $sortedByName = $this->repository->findWithFilters(
            tenantId: new UuidValueObject($this->tenant->uuid),
            filters: [],
            page: 1,
            perPage: 10,
            sortBy: 'name',
            sortDirection: 'asc'
        );

        // Act - Sort by rating descending
        $sortedByRating = $this->repository->findWithFilters(
            tenantId: new UuidValueObject($this->tenant->uuid),
            filters: [],
            page: 1,
            perPage: 10,
            sortBy: 'rating',
            sortDirection: 'desc'
        );

        // Assert - Name sorting
        $this->assertEquals('Alpha Vendor', $sortedByName[0]->getName());
        
        // Assert - Rating sorting (highest first)
        $this->assertEquals(5.0, $sortedByRating[0]->getRating());
    }

    /** @test */
    public function it_searches_vendors_correctly(): void
    {
        // Arrange
        Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'name' => 'Acme Corporation',
            'email' => 'contact@acme.com',
            'company_name' => 'Acme Corp',
        ]);

        Vendor::factory()->create([
            'tenant_id' => $this->tenantId,
            'name' => 'Beta Industries',
            'email' => 'info@beta.com',
            'company_name' => 'Beta Inc',
        ]);

        // Act - Search by name
        $result = $this->repository->findWithFilters(
            tenantId: new UuidValueObject($this->tenant->uuid),
            filters: ['search' => 'Acme'],
            page: 1,
            perPage: 10
        );

        // Assert
        $this->assertCount(1, $result);
        $this->assertEquals('Acme Corporation', $result[0]->getName());
    }

    /** @test */
    public function it_calculates_statistics_correctly(): void
    {
        // Arrange
        Vendor::factory()->count(5)->create([
            'tenant_id' => $this->tenantId,
            'status' => 'active',
            'rating' => 4.5,
        ]);

        Vendor::factory()->count(3)->create([
            'tenant_id' => $this->tenantId,
            'status' => 'inactive',
            'rating' => 3.0,
        ]);

        // Act
        $stats = $this->repository->getStatistics(new UuidValueObject($this->tenant->uuid));

        // Assert
        $this->assertIsArray($stats);
        $this->assertArrayHasKey('total', $stats);
        $this->assertArrayHasKey('active', $stats);
        $this->assertArrayHasKey('inactive', $stats);
        $this->assertArrayHasKey('average_rating', $stats);
        $this->assertArrayHasKey('active_percentage', $stats);
        
        // Should have 9 total vendors (5 active + 3 inactive + 1 from setUp)
        $this->assertEquals(9, $stats['total']);
        $this->assertEquals(6, $stats['active']); // 5 new + 1 from setUp
        $this->assertEquals(3, $stats['inactive']);
    }
}
