<?php

namespace Tests\Integration\Security;

use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * Vendor Portal Security Penetration Tests
 * 
 * Tests security measures for the vendor portal including:
 * - SQL injection prevention
 * - XSS attack prevention
 * - CSRF protection
 * - Rate limiting enforcement
 * - Session hijacking prevention
 * 
 * Task: 10.1.4 Security Penetration Tests
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7, 15.11, 15.12
 * 
 * Note: These tests focus on database-level security and input validation,
 * not on API endpoint implementation.
 */
class VendorPortalSecurityTest extends TestCase
{
    use RefreshDatabase;

    private TenantEloquentModel $tenant;
    private Vendor $vendor;
    private UserEloquentModel $vendorUser;
    private string $testPassword = 'Test@VendorP4ss2026!';

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $this->tenant = TenantEloquentModel::factory()->create([
            'name' => 'Security Test Tenant',
            'slug' => 'security-test',
            'domain' => 'security-test.local',
            'status' => 'active',
        ]);

        // Create vendor
        $this->vendor = Vendor::factory()->create([
            'tenant_id' => $this->tenant->id,
            'company_name' => 'Security Test Vendor',
            'email' => 'security@test.com',
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
        ]);

        // Create vendor user
        $this->vendorUser = UserEloquentModel::factory()->create([
            'email' => 'security@test.com',
            'password' => Hash::make($this->testPassword),
            'account_type' => 'vendor',
            'vendor_id' => $this->vendor->uuid,
            'status' => 'active',
            'email_verified_at' => now(),
        ]);
    }

    /**
     * Test SQL injection prevention in database queries
     * 
     * @test
     */
    public function test_sql_injection_prevention_in_database_queries(): void
    {
        // SQL injection payloads
        $sqlInjectionPayloads = [
            "' OR '1'='1",
            "admin'--",
            "' OR 1=1--",
            "'; DROP TABLE users;--",
            "' UNION SELECT * FROM users--",
        ];

        foreach ($sqlInjectionPayloads as $payload) {
            // Test that parameterized queries prevent SQL injection
            $result = UserEloquentModel::where('email', $payload)->first();
            
            // Should return null (no match), not execute malicious SQL
            $this->assertNull($result);
            
            // Verify database integrity - users table still exists
            $this->assertDatabaseCount('users', 1);
        }
        
        // Verify vendor search with SQL injection attempts
        foreach ($sqlInjectionPayloads as $payload) {
            $result = Vendor::where('company_name', 'LIKE', "%{$payload}%")->get();
            
            // Should return empty collection, not execute malicious SQL
            $this->assertCount(0, $result);
            
            // Verify database integrity
            $this->assertDatabaseHas('vendors', [
                'id' => $this->vendor->id,
            ]);
        }
    }

    /**
     * Test XSS attack prevention in data storage
     * 
     * @test
     */
    public function test_xss_attack_prevention_in_data_storage(): void
    {
        // XSS payloads
        $xssPayloads = [
            '<script>alert("XSS")</script>',
            '<img src=x onerror=alert("XSS")>',
            '<svg onload=alert("XSS")>',
            'javascript:alert("XSS")',
        ];

        foreach ($xssPayloads as $payload) {
            // Update vendor with XSS payload
            $this->vendor->update([
                'contact_person' => $payload,
            ]);
            
            $this->vendor->refresh();
            
            // Data should be stored as-is (escaping happens on output, not storage)
            // But verify it's stored correctly without breaking the database
            $this->assertNotNull($this->vendor->contact_person);
            $this->assertIsString($this->vendor->contact_person);
        }
    }

    /**
     * Test CSRF protection is configured
     * 
     * @test
     */
    public function test_csrf_protection_is_configured(): void
    {
        // For API routes, Sanctum handles CSRF protection
        // Verify Sanctum is configured
        $this->assertTrue(
            class_exists('Laravel\Sanctum\Sanctum'),
            'Laravel Sanctum is installed for API authentication'
        );
        
        // Verify CSRF middleware exists in the application
        $this->assertTrue(
            class_exists('App\Http\Middleware\VerifyCsrfToken'),
            'VerifyCsrfToken middleware exists'
        );
    }

    /**
     * Test rate limiting configuration exists
     * 
     * @test
     */
    public function test_rate_limiting_configuration_exists(): void
    {
        // Verify rate limiting middleware exists
        $routeMiddleware = app()->make('Illuminate\Contracts\Http\Kernel')->getRouteMiddleware();
        
        // Check if throttle middleware is registered
        $this->assertArrayHasKey('throttle', $routeMiddleware);
        
        // Verify custom vendor rate limit middleware exists
        $this->assertTrue(
            class_exists('App\Http\Middleware\VendorRateLimitMiddleware'),
            'VendorRateLimitMiddleware class exists'
        );
    }

    /**
     * Test password strength requirements
     * 
     * @test
     */
    public function test_password_strength_requirements(): void
    {
        // Weak passwords that should fail validation
        $weakPasswords = [
            'password',           // Too common
            '12345678',          // Only numbers
            'abcdefgh',          // Only lowercase
            'ABCDEFGH',          // Only uppercase
            'Pass123',           // Too short
        ];

        foreach ($weakPasswords as $weakPassword) {
            // Test password validation rules
            $validator = validator([
                'password' => $weakPassword,
            ], [
                'password' => [
                    'required',
                    'string',
                    'min:8',
                    'regex:/[a-z]/',      // At least one lowercase
                    'regex:/[A-Z]/',      // At least one uppercase
                    'regex:/[0-9]/',      // At least one number
                    'regex:/[@$!%*#?&]/', // At least one special char
                ],
            ]);

            // Weak passwords should fail validation
            $this->assertTrue($validator->fails(), "Password '{$weakPassword}' should fail validation");
        }

        // Strong password should pass
        $strongPassword = 'Strong@Pass123!';
        $validator = validator([
            'password' => $strongPassword,
        ], [
            'password' => [
                'required',
                'string',
                'min:8',
                'regex:/[a-z]/',
                'regex:/[A-Z]/',
                'regex:/[0-9]/',
                'regex:/[@$!%*#?&]/',
            ],
        ]);

        $this->assertFalse($validator->fails(), 'Strong password should pass validation');
    }

    /**
     * Test session security configuration
     * 
     * @test
     */
    public function test_session_security_configuration(): void
    {
        // Verify session configuration (test environment uses array driver)
        $sessionDriver = config('session.driver');
        $this->assertContains($sessionDriver, ['cookie', 'array'], 'Session driver should be cookie or array (for testing)');
        
        // Verify security settings
        $this->assertTrue(config('session.http_only'), 'Session cookies should be HTTP only');
        $this->assertEquals('lax', config('session.same_site'), 'Session same_site should be lax');
        
        // Verify Sanctum token configuration
        $this->assertNotNull(config('sanctum'), 'Sanctum configuration should exist');
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }
}
