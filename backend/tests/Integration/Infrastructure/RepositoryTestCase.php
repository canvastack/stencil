<?php

namespace Tests\Integration\Infrastructure;

use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Base test case for repository integration tests.
 * 
 * Provides common setup, database transaction handling, test data seeding,
 * and common assertions for repository tests.
 */
abstract class RepositoryTestCase extends TestCase
{
    use RefreshDatabase;

    /**
     * The tenant ID for test isolation.
     */
    protected int $tenantId;

    /**
     * The tenant model instance.
     */
    protected TenantEloquentModel $tenant;

    /**
     * The vendor model instance.
     */
    protected Vendor $vendor;

    /**
     * The user model instance (vendor user).
     */
    protected UserEloquentModel $user;

    /**
     * Setup the test environment.
     * 
     * Creates a tenant, vendor, and vendor user for testing.
     * Override this method in child classes to customize setup.
     */
    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant using factory
        $this->tenant = TenantEloquentModel::factory()->create();
        $this->tenantId = $this->tenant->id;

        // Create test vendor with portal access enabled
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

    /**
     * Create an additional tenant for tenant isolation tests.
     * 
     * @return array{tenant: TenantEloquentModel, tenantId: int, vendor: Vendor, user: UserEloquentModel}
     */
    protected function createAdditionalTenant(): array
    {
        $tenant = TenantEloquentModel::factory()->create();
        $tenantId = $tenant->id;

        $vendor = Vendor::factory()->create([
            'tenant_id' => $tenantId,
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'status' => 'active',
        ]);

        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenantId,
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
        ]);

        return [
            'tenant' => $tenant,
            'tenantId' => $tenantId,
            'vendor' => $vendor,
            'user' => $user,
        ];
    }

    /**
     * Create a vendor user for the current tenant.
     * 
     * @param array $attributes Additional attributes to override
     * @return UserEloquentModel
     */
    protected function createVendorUser(array $attributes = []): UserEloquentModel
    {
        return UserEloquentModel::factory()->create(array_merge([
            'tenant_id' => $this->tenantId,
            'vendor_id' => $this->vendor->uuid,
            'account_type' => 'vendor',
        ], $attributes));
    }

    /**
     * Create a vendor for the current tenant.
     * 
     * @param array $attributes Additional attributes to override
     * @return Vendor
     */
    protected function createVendor(array $attributes = []): Vendor
    {
        return Vendor::factory()->create(array_merge([
            'tenant_id' => $this->tenantId,
        ], $attributes));
    }

    /**
     * Create a platform admin user.
     * 
     * @param array $attributes Additional attributes to override
     * @return UserEloquentModel
     */
    protected function createPlatformUser(array $attributes = []): UserEloquentModel
    {
        return UserEloquentModel::factory()->create(array_merge([
            'tenant_id' => $this->tenantId,
            'vendor_id' => null,
            'account_type' => 'platform',
        ], $attributes));
    }

    /**
     * Create a tenant user.
     * 
     * @param array $attributes Additional attributes to override
     * @return UserEloquentModel
     */
    protected function createTenantUser(array $attributes = []): UserEloquentModel
    {
        return UserEloquentModel::factory()->create(array_merge([
            'tenant_id' => $this->tenantId,
            'vendor_id' => null,
            'account_type' => 'tenant',
        ], $attributes));
    }

    /**
     * Assert that a paginated result has the expected structure.
     * 
     * @param array $result The paginated result
     * @param int $expectedCount Expected number of items in data array
     * @param int|null $expectedTotal Expected total count (null to skip check)
     * @return void
     */
    protected function assertPaginatedResult(array $result, int $expectedCount, ?int $expectedTotal = null): void
    {
        $this->assertArrayHasKey('data', $result, 'Paginated result must have "data" key');
        $this->assertArrayHasKey('total', $result, 'Paginated result must have "total" key');
        $this->assertArrayHasKey('per_page', $result, 'Paginated result must have "per_page" key');
        $this->assertArrayHasKey('current_page', $result, 'Paginated result must have "current_page" key');
        $this->assertArrayHasKey('last_page', $result, 'Paginated result must have "last_page" key');

        $this->assertIsArray($result['data'], 'Data must be an array');
        $this->assertCount($expectedCount, $result['data'], "Expected {$expectedCount} items in data array");

        if ($expectedTotal !== null) {
            $this->assertEquals($expectedTotal, $result['total'], "Expected total to be {$expectedTotal}");
        }
    }

    /**
     * Assert that all items in a collection belong to the specified tenant.
     * 
     * @param array $items Array of items with tenant_id
     * @param int $expectedTenantId Expected tenant ID
     * @return void
     */
    protected function assertTenantIsolation(array $items, int $expectedTenantId): void
    {
        foreach ($items as $item) {
            $this->assertEquals(
                $expectedTenantId,
                $item['tenant_id'] ?? null,
                'All items must belong to the expected tenant'
            );
        }
    }

    /**
     * Assert that a repository result contains domain entity data.
     * 
     * @param array $result The result array
     * @param array $expectedKeys Expected keys in the result
     * @return void
     */
    protected function assertDomainEntityStructure(array $result, array $expectedKeys): void
    {
        foreach ($expectedKeys as $key) {
            $this->assertArrayHasKey($key, $result, "Result must have '{$key}' key");
        }
    }

    /**
     * Assert that a timestamp field is recent (within last minute).
     * 
     * @param string|null $timestamp The timestamp to check
     * @param string $message Optional assertion message
     * @return void
     */
    protected function assertRecentTimestamp(?string $timestamp, string $message = ''): void
    {
        $this->assertNotNull($timestamp, $message ?: 'Timestamp should not be null');
        
        $timestampObj = new \DateTimeImmutable($timestamp);
        $now = new \DateTimeImmutable();
        $diff = $now->getTimestamp() - $timestampObj->getTimestamp();
        
        $this->assertLessThanOrEqual(
            60,
            $diff,
            $message ?: 'Timestamp should be within the last minute'
        );
    }

    /**
     * Assert that a UUID string is valid.
     * 
     * @param string $uuid The UUID to validate
     * @param string $message Optional assertion message
     * @return void
     */
    protected function assertValidUuid(string $uuid, string $message = ''): void
    {
        $pattern = '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i';
        $this->assertMatchesRegularExpression(
            $pattern,
            $uuid,
            $message ?: 'String must be a valid UUID v4'
        );
    }

    /**
     * Assert that a collection is sorted by a specific field.
     * 
     * @param array $items Array of items
     * @param string $field Field name to check sorting
     * @param string $direction Sort direction ('asc' or 'desc')
     * @return void
     */
    protected function assertSortedBy(array $items, string $field, string $direction = 'asc'): void
    {
        $values = array_column($items, $field);
        $sorted = $values;
        
        if ($direction === 'asc') {
            sort($sorted);
        } else {
            rsort($sorted);
        }
        
        $this->assertEquals(
            $sorted,
            $values,
            "Items should be sorted by '{$field}' in '{$direction}' order"
        );
    }

    /**
     * Assert that a database table has a record matching the given data.
     * 
     * This is a convenience wrapper around assertDatabaseHas with better error messages.
     * 
     * @param string $table Table name
     * @param array $data Data to match
     * @param string|null $connection Database connection
     * @return void
     */
    protected function assertDatabaseHasRecord(string $table, array $data, ?string $connection = null): void
    {
        $this->assertDatabaseHas($table, $data, $connection);
    }

    /**
     * Assert that a database table does not have a record matching the given data.
     * 
     * This is a convenience wrapper around assertDatabaseMissing with better error messages.
     * 
     * @param string $table Table name
     * @param array $data Data to match
     * @param string|null $connection Database connection
     * @return void
     */
    protected function assertDatabaseMissingRecord(string $table, array $data, ?string $connection = null): void
    {
        $this->assertDatabaseMissing($table, $data, $connection);
    }

    /**
     * Create test data in bulk for performance testing.
     * 
     * @param string $factoryClass Factory class name
     * @param int $count Number of records to create
     * @param array $attributes Attributes to override
     * @return \Illuminate\Database\Eloquent\Collection
     */
    protected function createBulkTestData(string $factoryClass, int $count, array $attributes = [])
    {
        return $factoryClass::factory()
            ->count($count)
            ->create(array_merge([
                'tenant_id' => $this->tenantId,
            ], $attributes));
    }

    /**
     * Assert that a query result is empty.
     * 
     * @param array $result The result to check
     * @return void
     */
    protected function assertEmptyResult(array $result): void
    {
        if (isset($result['data'])) {
            // Paginated result
            $this->assertEmpty($result['data'], 'Result data should be empty');
            $this->assertEquals(0, $result['total'], 'Result total should be 0');
        } else {
            // Simple array result
            $this->assertEmpty($result, 'Result should be empty');
        }
    }

    /**
     * Assert that a result contains specific items by ID.
     * 
     * @param array $result The result array
     * @param array $expectedIds Expected IDs
     * @param string $idField ID field name (default: 'id')
     * @return void
     */
    protected function assertContainsIds(array $result, array $expectedIds, string $idField = 'id'): void
    {
        $data = $result['data'] ?? $result;
        $actualIds = array_column($data, $idField);
        
        foreach ($expectedIds as $expectedId) {
            $this->assertContains(
                $expectedId,
                $actualIds,
                "Result should contain item with {$idField}: {$expectedId}"
            );
        }
    }

    /**
     * Assert that a result does not contain specific items by ID.
     * 
     * @param array $result The result array
     * @param array $excludedIds IDs that should not be present
     * @param string $idField ID field name (default: 'id')
     * @return void
     */
    protected function assertNotContainsIds(array $result, array $excludedIds, string $idField = 'id'): void
    {
        $data = $result['data'] ?? $result;
        $actualIds = array_column($data, $idField);
        
        foreach ($excludedIds as $excludedId) {
            $this->assertNotContains(
                $excludedId,
                $actualIds,
                "Result should not contain item with {$idField}: {$excludedId}"
            );
        }
    }
}
