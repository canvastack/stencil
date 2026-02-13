<?php

namespace Tests\Integration\Infrastructure;

/**
 * Test the RepositoryTestCase base class functionality.
 * 
 * This test verifies that all helper methods in the base class work correctly.
 */
class RepositoryTestCaseTest extends RepositoryTestCase
{
    /** @test */
    public function it_sets_up_test_environment_correctly(): void
    {
        // Assert tenant is created
        $this->assertNotNull($this->tenant);
        $this->assertNotNull($this->tenantId);
        $this->assertDatabaseHas('tenants', ['id' => $this->tenantId]);

        // Assert vendor is created
        $this->assertNotNull($this->vendor);
        $this->assertEquals($this->tenantId, $this->vendor->tenant_id);
        $this->assertTrue($this->vendor->portal_access_enabled);
        $this->assertEquals('completed', $this->vendor->onboarding_status);
        $this->assertEquals('active', $this->vendor->status);

        // Assert user is created
        $this->assertNotNull($this->user);
        $this->assertEquals($this->tenantId, $this->user->tenant_id);
        $this->assertEquals($this->vendor->uuid, $this->user->vendor_id);
        $this->assertEquals('vendor', $this->user->account_type);
    }

    /** @test */
    public function it_creates_additional_tenant(): void
    {
        // Act
        $additional = $this->createAdditionalTenant();

        // Assert
        $this->assertArrayHasKey('tenant', $additional);
        $this->assertArrayHasKey('tenantId', $additional);
        $this->assertArrayHasKey('vendor', $additional);
        $this->assertArrayHasKey('user', $additional);

        $this->assertNotEquals($this->tenantId, $additional['tenantId']);
        $this->assertDatabaseHas('tenants', ['id' => $additional['tenantId']]);
        $this->assertDatabaseHas('vendors', ['id' => $additional['vendor']->id]);
        $this->assertDatabaseHas('users', ['id' => $additional['user']->id]);
    }

    /** @test */
    public function it_creates_vendor_user(): void
    {
        // Act
        $user = $this->createVendorUser(['name' => 'Test Vendor User']);

        // Assert
        $this->assertEquals($this->tenantId, $user->tenant_id);
        $this->assertEquals($this->vendor->uuid, $user->vendor_id);
        $this->assertEquals('vendor', $user->account_type);
        $this->assertEquals('Test Vendor User', $user->name);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'name' => 'Test Vendor User']);
    }

    /** @test */
    public function it_creates_vendor(): void
    {
        // Act
        $vendor = $this->createVendor(['name' => 'Test Vendor Company']);

        // Assert
        $this->assertEquals($this->tenantId, $vendor->tenant_id);
        $this->assertEquals('Test Vendor Company', $vendor->name);
        $this->assertDatabaseHas('vendors', ['id' => $vendor->id, 'name' => 'Test Vendor Company']);
    }

    /** @test */
    public function it_creates_platform_user(): void
    {
        // Act
        $user = $this->createPlatformUser(['name' => 'Platform Admin']);

        // Assert
        $this->assertEquals($this->tenantId, $user->tenant_id);
        $this->assertNull($user->vendor_id);
        $this->assertEquals('platform', $user->account_type);
        $this->assertEquals('Platform Admin', $user->name);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'account_type' => 'platform']);
    }

    /** @test */
    public function it_creates_tenant_user(): void
    {
        // Act
        $user = $this->createTenantUser(['name' => 'Tenant User']);

        // Assert
        $this->assertEquals($this->tenantId, $user->tenant_id);
        $this->assertNull($user->vendor_id);
        $this->assertEquals('tenant', $user->account_type);
        $this->assertEquals('Tenant User', $user->name);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'account_type' => 'tenant']);
    }

    /** @test */
    public function it_asserts_paginated_result_structure(): void
    {
        // Arrange
        $result = [
            'data' => [
                ['id' => 1, 'name' => 'Item 1'],
                ['id' => 2, 'name' => 'Item 2'],
            ],
            'total' => 2,
            'per_page' => 10,
            'current_page' => 1,
            'last_page' => 1,
        ];

        // Act & Assert - should not throw
        $this->assertPaginatedResult($result, 2, 2);
    }

    /** @test */
    public function it_asserts_tenant_isolation(): void
    {
        // Arrange
        $items = [
            ['id' => 1, 'tenant_id' => $this->tenantId],
            ['id' => 2, 'tenant_id' => $this->tenantId],
            ['id' => 3, 'tenant_id' => $this->tenantId],
        ];

        // Act & Assert - should not throw
        $this->assertTenantIsolation($items, $this->tenantId);
    }

    /** @test */
    public function it_asserts_domain_entity_structure(): void
    {
        // Arrange
        $result = [
            'id' => 1,
            'name' => 'Test',
            'email' => 'test@example.com',
            'status' => 'active',
        ];

        // Act & Assert - should not throw
        $this->assertDomainEntityStructure($result, ['id', 'name', 'email', 'status']);
    }

    /** @test */
    public function it_asserts_recent_timestamp(): void
    {
        // Arrange
        $timestamp = now()->toIso8601String();

        // Act & Assert - should not throw
        $this->assertRecentTimestamp($timestamp);
    }

    /** @test */
    public function it_asserts_valid_uuid(): void
    {
        // Arrange
        $uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();

        // Act & Assert - should not throw
        $this->assertValidUuid($uuid);
    }

    /** @test */
    public function it_asserts_sorted_by_ascending(): void
    {
        // Arrange
        $items = [
            ['id' => 1, 'name' => 'Apple'],
            ['id' => 2, 'name' => 'Banana'],
            ['id' => 3, 'name' => 'Cherry'],
        ];

        // Act & Assert - should not throw
        $this->assertSortedBy($items, 'name', 'asc');
    }

    /** @test */
    public function it_asserts_sorted_by_descending(): void
    {
        // Arrange
        $items = [
            ['id' => 3, 'created_at' => '2024-03-03'],
            ['id' => 2, 'created_at' => '2024-03-02'],
            ['id' => 1, 'created_at' => '2024-03-01'],
        ];

        // Act & Assert - should not throw
        $this->assertSortedBy($items, 'created_at', 'desc');
    }

    /** @test */
    public function it_asserts_database_has_record(): void
    {
        // Act & Assert - should not throw
        $this->assertDatabaseHasRecord('vendors', ['id' => $this->vendor->id]);
    }

    /** @test */
    public function it_asserts_database_missing_record(): void
    {
        // Act & Assert - should not throw
        $this->assertDatabaseMissingRecord('vendors', ['id' => 999999, 'name' => 'Non-existent Vendor']);
    }

    /** @test */
    public function it_asserts_empty_result_for_paginated(): void
    {
        // Arrange
        $result = [
            'data' => [],
            'total' => 0,
            'per_page' => 10,
            'current_page' => 1,
            'last_page' => 1,
        ];

        // Act & Assert - should not throw
        $this->assertEmptyResult($result);
    }

    /** @test */
    public function it_asserts_empty_result_for_simple_array(): void
    {
        // Arrange
        $result = [];

        // Act & Assert - should not throw
        $this->assertEmptyResult($result);
    }

    /** @test */
    public function it_asserts_contains_ids(): void
    {
        // Arrange
        $result = [
            'data' => [
                ['id' => 1, 'name' => 'Item 1'],
                ['id' => 2, 'name' => 'Item 2'],
                ['id' => 3, 'name' => 'Item 3'],
            ],
        ];

        // Act & Assert - should not throw
        $this->assertContainsIds($result, [1, 2]);
    }

    /** @test */
    public function it_asserts_not_contains_ids(): void
    {
        // Arrange
        $result = [
            'data' => [
                ['id' => 1, 'name' => 'Item 1'],
                ['id' => 2, 'name' => 'Item 2'],
            ],
        ];

        // Act & Assert - should not throw
        $this->assertNotContainsIds($result, [3, 4, 5]);
    }
}
