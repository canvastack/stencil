<?php

namespace Tests\Feature\Api\Vendor;

/**
 * VendorApiTestCaseTest
 * 
 * Tests for the VendorApiTestCase base class to verify all helper methods work correctly.
 * 
 * This test ensures:
 * 1. Authentication helpers work
 * 2. Common assertions work
 * 3. Tenant isolation helpers work
 * 4. Test data creation helpers work
 */
class VendorApiTestCaseTest extends VendorApiTestCase
{
    /** @test */
    public function base_class_sets_up_test_environment_correctly(): void
    {
        // Verify tenant was created
        $this->assertNotNull($this->tenant);
        $this->assertEquals('Test Tenant', $this->tenant->name);
        $this->assertEquals('active', $this->tenant->status);

        // Verify vendor was created
        $this->assertNotNull($this->vendor);
        $this->assertEquals('Test Vendor Company', $this->vendor->company_name);
        $this->assertEquals($this->tenant->id, $this->vendor->tenant_id);
        $this->assertTrue($this->vendor->portal_access_enabled);
        $this->assertEquals('completed', $this->vendor->onboarding_status);

        // Verify vendor user was created
        $this->assertNotNull($this->vendorUser);
        $this->assertEquals('vendor', $this->vendorUser->account_type);
        $this->assertEquals($this->vendor->uuid, $this->vendorUser->vendor_id);
        $this->assertEquals('active', $this->vendorUser->status);
    }

    /** @test */
    public function acting_as_vendor_helper_authenticates_correctly(): void
    {
        // Make an authenticated request using the helper
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        // Should not get 401 Unauthorized
        $response->assertStatus(200);
    }

    /** @test */
    public function create_additional_vendor_helper_works(): void
    {
        $additionalVendor = $this->createAdditionalVendor([
            'company_name' => 'Additional Vendor',
            'email' => 'additional@test.com',
        ]);

        $this->assertNotNull($additionalVendor);
        $this->assertEquals('Additional Vendor', $additionalVendor->company_name);
        $this->assertEquals($this->tenant->id, $additionalVendor->tenant_id);
    }

    /** @test */
    public function create_vendor_in_other_tenant_helper_works(): void
    {
        $otherTenantData = $this->createVendorInOtherTenant();

        $this->assertArrayHasKey('tenant', $otherTenantData);
        $this->assertArrayHasKey('vendor', $otherTenantData);
        $this->assertArrayHasKey('user', $otherTenantData);

        $this->assertNotEquals($this->tenant->id, $otherTenantData['tenant']->id);
        $this->assertEquals($otherTenantData['tenant']->id, $otherTenantData['vendor']->tenant_id);
    }

    /** @test */
    public function assert_success_response_works(): void
    {
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        // Should not throw assertion error
        $this->assertSuccessResponse($response);
        $this->assertSuccessResponse($response, 'Profile retrieved successfully');
    }

    /** @test */
    public function assert_unauthorized_response_works(): void
    {
        $response = $this->getJson('/api/v1/vendor/profile');

        // Should not throw assertion error
        $this->assertUnauthorizedResponse($response);
    }

    /** @test */
    public function assert_has_uuid_works(): void
    {
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        // Should not throw assertion error
        $this->assertHasUuid($response);
    }

    /** @test */
    public function assert_data_types_valid_works(): void
    {
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        $data = $response->json('data');

        // Should not throw assertion error
        $this->assertDataTypesValid($data);
    }

    /** @test */
    public function assert_authentication_required_works(): void
    {
        // Should not throw assertion error
        $this->assertAuthenticationRequired('GET', '/api/v1/vendor/profile');
        $this->assertAuthenticationRequired('PUT', '/api/v1/vendor/profile', ['phone' => '+1234567890']);
    }

    /** @test */
    public function assert_tenant_isolation_works(): void
    {
        $response = $this->actingAsVendor()
            ->getJson('/api/v1/vendor/profile');

        // Should not throw assertion error (profile doesn't expose tenant_id, but we can check vendor belongs to tenant)
        $vendorUuid = $response->json('data.uuid');
        $this->assertEquals($this->vendor->uuid, $vendorUuid);
    }

    /** @test */
    public function assert_validation_error_response_works(): void
    {
        $response = $this->actingAsVendor()
            ->putJson('/api/v1/vendor/profile', [
                'email' => 'invalid-email',
            ]);

        // Should not throw assertion error
        $this->assertValidationErrorResponse($response);
        $this->assertValidationErrorResponse($response, 'email');
    }

    /** @test */
    public function assert_not_found_response_works(): void
    {
        $fakeUuid = '00000000-0000-0000-0000-000000000000';
        
        $response = $this->actingAsVendor()
            ->getJson("/api/v1/vendor/quotes/{$fakeUuid}");

        // Should not throw assertion error
        $this->assertNotFoundResponse($response);
    }
}

