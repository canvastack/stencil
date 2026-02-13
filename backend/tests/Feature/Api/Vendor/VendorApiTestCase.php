<?php

namespace Tests\Feature\Api\Vendor;

use Tests\TestCase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Laravel\Sanctum\Sanctum;
use Tests\Middleware\TestTenantContextMiddleware;

/**
 * VendorApiTestCase
 * 
 * Base test case for vendor API endpoint tests.
 * Provides common setup, authentication helpers, and API assertions.
 * 
 * Features:
 * - Automatic tenant, vendor, and vendor user setup
 * - Sanctum authentication helpers
 * - Common API response assertions
 * - Tenant isolation testing helpers
 * - OpenAPI spec validation helpers
 * 
 * Usage:
 * ```php
 * class MyVendorControllerTest extends VendorApiTestCase
 * {
 *     public function test_something(): void
 *     {
 *         $response = $this->actingAsVendor()
 *             ->getJson('/api/v1/vendor/profile');
 *         
 *         $this->assertSuccessResponse($response);
 *     }
 * }
 * ```
 */
abstract class VendorApiTestCase extends TestCase
{
    use RefreshDatabase;

    /**
     * Test tenant instance
     */
    protected TenantEloquentModel $tenant;

    /**
     * Test vendor instance
     */
    protected Vendor $vendor;

    /**
     * Test vendor user instance
     */
    protected UserEloquentModel $vendorUser;

    /**
     * Default test password for vendor users
     */
    protected string $testPassword = 'Test@VendorP4ss2026!';

    /**
     * Setup test environment before each test
     */
    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test tenant
        $this->tenant = $this->createTestTenant();
        
        // Create test vendor
        $this->vendor = $this->createTestVendor();
        
        // Create test vendor user
        $this->vendorUser = $this->createTestVendorUser();
        
        // Register tenant context for test middleware
        $this->registerTenantContext();
        
        // Replace TenantContextMiddleware with test version
        $this->app[\Illuminate\Contracts\Http\Kernel::class]
            ->prependMiddleware(TestTenantContextMiddleware::class);
    }

    /**
     * Create a test tenant
     */
    protected function createTestTenant(array $attributes = []): TenantEloquentModel
    {
        return TenantEloquentModel::factory()->create(array_merge([
            'name' => 'Test Tenant',
            'slug' => 'test-tenant',
            'domain' => 'test-tenant.local',
            'status' => 'active',
        ], $attributes));
    }

    /**
     * Create a test vendor
     */
    protected function createTestVendor(array $attributes = []): Vendor
    {
        return Vendor::factory()->create(array_merge([
            'tenant_id' => $this->tenant->id,
            'company_name' => 'Test Vendor Company',
            'email' => 'vendor@test.com',
            'phone' => '+1234567890',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
        ], $attributes));
    }

    /**
     * Create a test vendor user
     */
    protected function createTestVendorUser(array $attributes = []): UserEloquentModel
    {
        return UserEloquentModel::create(array_merge([
            'tenant_id' => $this->tenant->id,
            'vendor_id' => $this->vendor->uuid,
            'name' => 'Vendor User',
            'email' => $this->vendor->email,
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'status' => 'active',
            'failed_login_attempts' => 0,
        ], $attributes));
    }

    /**
     * Register tenant context for test middleware
     */
    protected function registerTenantContext(): void
    {
        $this->app->instance('test.tenant.context', [
            'tenant_id' => $this->tenant->id,
            'tenant' => $this->tenant,
        ]);
    }

    /**
     * Authenticate as the test vendor user
     * 
     * @return $this
     */
    protected function actingAsVendor()
    {
        Sanctum::actingAs($this->vendorUser, ['vendor:access']);
        return $this;
    }

    /**
     * Authenticate as a specific vendor user
     * 
     * @param UserEloquentModel $user
     * @param array $abilities
     * @return $this
     */
    protected function actingAsVendorUser(UserEloquentModel $user, array $abilities = ['vendor:access'])
    {
        Sanctum::actingAs($user, $abilities);
        return $this;
    }

    /**
     * Create an additional vendor in the same tenant
     */
    protected function createAdditionalVendor(array $attributes = []): Vendor
    {
        return Vendor::factory()->create(array_merge([
            'tenant_id' => $this->tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ], $attributes));
    }

    /**
     * Create a vendor in a different tenant (for isolation testing)
     */
    protected function createVendorInOtherTenant(): array
    {
        $otherTenant = TenantEloquentModel::factory()->create([
            'name' => 'Other Tenant',
            'slug' => 'other-tenant',
            'domain' => 'other-tenant.local',
            'status' => 'active',
        ]);

        $otherVendor = Vendor::factory()->create([
            'tenant_id' => $otherTenant->id,
            'company_name' => 'Other Vendor',
            'email' => 'other-vendor@test.com',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        $otherVendorUser = UserEloquentModel::create([
            'tenant_id' => $otherTenant->id,
            'vendor_id' => $otherVendor->uuid,
            'name' => 'Other Vendor User',
            'email' => 'other-vendor@test.com',
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'status' => 'active',
        ]);

        return [
            'tenant' => $otherTenant,
            'vendor' => $otherVendor,
            'user' => $otherVendorUser,
        ];
    }

    // ========================================
    // Common API Assertions
    // ========================================

    /**
     * Assert response is a successful API response (200 OK)
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param string|null $expectedMessage
     */
    protected function assertSuccessResponse($response, ?string $expectedMessage = null): void
    {
        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'data',
            ]);

        if ($expectedMessage) {
            $response->assertJson(['message' => $expectedMessage]);
        }
    }

    /**
     * Assert response is a successful creation response (201 Created)
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param string|null $expectedMessage
     */
    protected function assertCreatedResponse($response, ?string $expectedMessage = null): void
    {
        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data',
            ]);

        if ($expectedMessage) {
            $response->assertJson(['message' => $expectedMessage]);
        }
    }

    /**
     * Assert response is an unauthorized error (401)
     */
    protected function assertUnauthorizedResponse($response): void
    {
        $response->assertStatus(401);
    }

    /**
     * Assert response is a forbidden error (403)
     */
    protected function assertForbiddenResponse($response): void
    {
        $response->assertStatus(403);
    }

    /**
     * Assert response is a not found error (404)
     */
    protected function assertNotFoundResponse($response): void
    {
        $response->assertStatus(404);
    }

    /**
     * Assert response is a validation error (422)
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param array|string $expectedErrors Field names that should have validation errors
     */
    protected function assertValidationErrorResponse($response, $expectedErrors = []): void
    {
        $response->assertStatus(422);

        if (!empty($expectedErrors)) {
            $errors = is_array($expectedErrors) ? $expectedErrors : [$expectedErrors];
            $response->assertJsonValidationErrors($errors);
        }
    }

    /**
     * Assert response has pagination structure
     */
    protected function assertHasPagination($response): void
    {
        $response->assertJsonStructure([
            'pagination' => [
                'current_page',
                'per_page',
                'total',
                'last_page',
            ],
        ]);
    }

    /**
     * Assert response data is an array with expected count
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param int $expectedCount
     */
    protected function assertDataCount($response, int $expectedCount): void
    {
        $data = $response->json('data');
        $this->assertIsArray($data);
        $this->assertCount($expectedCount, $data);
    }

    /**
     * Assert response data contains UUID field
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param string $path Path to UUID field (e.g., 'data.uuid' or 'data.0.uuid')
     */
    protected function assertHasUuid($response, string $path = 'data.uuid'): void
    {
        $uuid = $response->json($path);
        $this->assertIsString($uuid);
        $this->assertMatchesRegularExpression(
            '/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i',
            $uuid,
            'Expected valid UUID v4 format'
        );
    }

    /**
     * Assert response data does NOT contain internal database IDs
     * 
     * @param \Illuminate\Testing\TestResponse $response
     */
    protected function assertNoInternalIds($response): void
    {
        $data = $response->json('data');
        
        // Check if data is array of items or single item
        $items = isset($data[0]) ? $data : [$data];
        
        foreach ($items as $item) {
            // UUID should be present
            $this->assertArrayHasKey('uuid', $item, 'Response should contain uuid field');
            
            // Internal ID should NOT be exposed (or if present, should be different from UUID)
            if (isset($item['id'])) {
                $this->assertNotEquals($item['uuid'], $item['id'], 'Internal ID should not match UUID');
            }
        }
    }

    /**
     * Assert tenant isolation - response data belongs to test tenant
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param string $tenantIdPath Path to tenant_id field
     */
    protected function assertTenantIsolation($response, string $tenantIdPath = 'data.tenant_id'): void
    {
        $tenantId = $response->json($tenantIdPath);
        
        if ($tenantId !== null) {
            $this->assertEquals(
                $this->tenant->id,
                $tenantId,
                'Response data should belong to test tenant'
            );
        }
    }

    /**
     * Assert response matches OpenAPI spec structure
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param array $expectedStructure
     */
    protected function assertMatchesOpenApiSpec($response, array $expectedStructure): void
    {
        $response->assertJsonStructure($expectedStructure);
        
        // Verify data types match expectations
        $data = $response->json('data');
        
        if (is_array($data) && !empty($data)) {
            $this->assertDataTypesValid($data);
        }
    }

    /**
     * Assert data types are valid (no null where not expected, correct types)
     * 
     * @param array $data
     */
    protected function assertDataTypesValid(array $data): void
    {
        // Check if data is array of items or single item
        $items = isset($data[0]) ? $data : [$data];
        
        foreach ($items as $item) {
            // UUID should be string
            if (isset($item['uuid'])) {
                $this->assertIsString($item['uuid']);
            }
            
            // Timestamps should be strings (ISO 8601 format)
            foreach (['created_at', 'updated_at', 'sent_at', 'responded_at'] as $timestampField) {
                if (isset($item[$timestampField]) && $item[$timestampField] !== null) {
                    $this->assertIsString($item[$timestampField]);
                }
            }
            
            // Boolean fields should be boolean
            foreach (['is_read', 'portal_access_enabled'] as $boolField) {
                if (isset($item[$boolField])) {
                    $this->assertIsBool($item[$boolField]);
                }
            }
            
            // Numeric fields should be numeric
            foreach (['total', 'amount', 'price'] as $numericField) {
                if (isset($item[$numericField]) && $item[$numericField] !== null) {
                    $this->assertTrue(
                        is_numeric($item[$numericField]),
                        "Field '{$numericField}' should be numeric"
                    );
                }
            }
        }
    }

    /**
     * Assert response contains error message
     * 
     * @param \Illuminate\Testing\TestResponse $response
     * @param string|null $expectedMessage
     */
    protected function assertErrorResponse($response, ?string $expectedMessage = null): void
    {
        $response->assertJsonStructure(['message']);
        
        if ($expectedMessage) {
            $response->assertJson(['message' => $expectedMessage]);
        }
    }

    /**
     * Assert authentication is required for endpoint
     * 
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param string $uri Endpoint URI
     * @param array $data Request data (for POST/PUT)
     */
    protected function assertAuthenticationRequired(string $method, string $uri, array $data = []): void
    {
        $method = strtolower($method);
        
        $response = match($method) {
            'get' => $this->getJson($uri),
            'post' => $this->postJson($uri, $data),
            'put' => $this->putJson($uri, $data),
            'patch' => $this->patchJson($uri, $data),
            'delete' => $this->deleteJson($uri),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };
        
        $this->assertUnauthorizedResponse($response);
    }

    /**
     * Assert rate limiting is enforced
     * 
     * @param string $method HTTP method
     * @param string $uri Endpoint URI
     * @param int $maxAttempts Maximum allowed attempts
     * @param array $data Request data
     */
    protected function assertRateLimitEnforced(
        string $method,
        string $uri,
        int $maxAttempts,
        array $data = []
    ): void {
        $method = strtolower($method);
        
        // Make requests up to the limit
        for ($i = 0; $i < $maxAttempts; $i++) {
            $response = match($method) {
                'get' => $this->getJson($uri),
                'post' => $this->postJson($uri, $data),
                'put' => $this->putJson($uri, $data),
                default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
            };
            
            // Should succeed (or fail for other reasons, but not rate limit)
            $this->assertNotEquals(429, $response->status());
        }
        
        // Next request should be rate limited
        $response = match($method) {
            'get' => $this->getJson($uri),
            'post' => $this->postJson($uri, $data),
            'put' => $this->putJson($uri, $data),
            default => throw new \InvalidArgumentException("Unsupported HTTP method: {$method}"),
        };
        
        $response->assertStatus(429);
        $response->assertHeader('Retry-After');
    }
}

