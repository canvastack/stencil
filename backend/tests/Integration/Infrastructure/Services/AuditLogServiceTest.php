<?php

declare(strict_types=1);

namespace Tests\Integration\Infrastructure\Services;

use App\Infrastructure\Services\Audit\LaravelAuditLogService;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\Models\User;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Tests\TestCase;

/**
 * Audit Log Service Integration Tests
 * 
 * Tests the LaravelAuditLogService implementation with real database.
 * Requirements: 16.1, 16.2, 16.3, 16.4, 15.7, 15.8
 * 
 * Target: 4 tests
 * - Test logVendorLogin() creates log
 * - Test logFailedLogin() creates log
 * - Test logQuoteResponse() creates log
 * - Test IP address capture
 */
class AuditLogServiceTest extends TestCase
{
    use RefreshDatabase;

    private LaravelAuditLogService $auditLogService;
    private AuditLogRepositoryInterface $auditLogRepository;
    private int $tenantId;
    private User $vendorUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Create tenant
        $tenant = TenantEloquentModel::factory()->create();
        $this->tenantId = $tenant->id;

        // Create vendor user
        $this->vendorUser = User::factory()->create([
            'tenant_id' => $this->tenantId,
            'account_type' => 'vendor',
            'status' => 'active',
        ]);

        // Get services from container
        $this->auditLogRepository = app(AuditLogRepositoryInterface::class);
        $this->auditLogService = new LaravelAuditLogService($this->auditLogRepository);
    }

    /** @test */
    public function it_logs_vendor_login_successfully(): void
    {
        // Arrange
        $vendorUuid = 'vendor-uuid-123';
        $metadata = ['browser' => 'Chrome'];

        // Mock request with IP and user agent
        $this->mockRequest('192.168.1.100', 'Mozilla/5.0 Chrome');

        // Act
        $this->auditLogService->logVendorLogin(
            $this->tenantId,
            $this->vendorUser->id,
            $vendorUuid,
            $metadata
        );

        // Assert
        $this->assertDatabaseHas('audit_logs', [
            'tenant_id' => $this->tenantId,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'vendor.login',
            'resource_type' => 'vendor',
            'resource_id' => $vendorUuid,
            'ip_address' => '192.168.1.100',
            'user_agent' => 'Mozilla/5.0 Chrome',
        ]);

        // Verify metadata contains login_at timestamp
        $log = \App\Infrastructure\Persistence\Eloquent\Models\AuditLog::where('action_type', 'vendor.login')->first();
        $this->assertNotNull($log);
        $this->assertArrayHasKey('login_at', $log->metadata);
        $this->assertArrayHasKey('browser', $log->metadata);
        $this->assertEquals('Chrome', $log->metadata['browser']);
    }

    /** @test */
    public function it_logs_failed_login_attempt(): void
    {
        // Arrange
        $email = 'vendor@example.com';
        $reason = 'invalid_credentials';
        $metadata = ['attempt_count' => 3];

        // Mock request with IP and user agent
        $this->mockRequest('10.0.0.50', 'Mozilla/5.0 Firefox');

        // Act
        $this->auditLogService->logFailedLogin(
            $this->tenantId,
            $email,
            $reason,
            $metadata
        );

        // Assert
        $this->assertDatabaseHas('audit_logs', [
            'tenant_id' => $this->tenantId,
            'user_id' => null, // Failed login has no user_id
            'user_type' => 'vendor',
            'action_type' => 'vendor.login.failed',
            'resource_type' => 'authentication',
            'resource_id' => $email,
            'ip_address' => '10.0.0.50',
            'user_agent' => 'Mozilla/5.0 Firefox',
        ]);

        // Verify metadata contains email, reason, and attempted_at
        $log = \App\Infrastructure\Persistence\Eloquent\Models\AuditLog::where('action_type', 'vendor.login.failed')->first();
        $this->assertNotNull($log);
        $this->assertArrayHasKey('email', $log->metadata);
        $this->assertArrayHasKey('reason', $log->metadata);
        $this->assertArrayHasKey('attempted_at', $log->metadata);
        $this->assertArrayHasKey('attempt_count', $log->metadata);
        $this->assertEquals($email, $log->metadata['email']);
        $this->assertEquals($reason, $log->metadata['reason']);
        $this->assertEquals(3, $log->metadata['attempt_count']);
    }

    /** @test */
    public function it_logs_quote_response_with_old_and_new_values(): void
    {
        // Arrange
        $quoteUuid = 'quote-uuid-456';
        $responseType = 'accepted';
        $oldValues = [
            'status' => 'sent',
            'responded_at' => null,
        ];
        $newValues = [
            'status' => 'accepted',
            'responded_at' => '2026-02-09 10:00:00',
            'estimated_delivery_days' => 5,
        ];

        // Mock request with IP and user agent
        $this->mockRequest('172.16.0.1', 'Mozilla/5.0 Safari');

        // Act
        $this->auditLogService->logQuoteResponse(
            $this->tenantId,
            $this->vendorUser->id,
            $quoteUuid,
            $responseType,
            $oldValues,
            $newValues
        );

        // Assert
        $this->assertDatabaseHas('audit_logs', [
            'tenant_id' => $this->tenantId,
            'user_id' => $this->vendorUser->id,
            'user_type' => 'vendor',
            'action_type' => 'quote.accepted',
            'resource_type' => 'quote',
            'resource_id' => $quoteUuid,
            'ip_address' => '172.16.0.1',
            'user_agent' => 'Mozilla/5.0 Safari',
        ]);

        // Verify old_values and new_values are stored correctly
        $log = \App\Infrastructure\Persistence\Eloquent\Models\AuditLog::where('action_type', 'quote.accepted')->first();
        $this->assertNotNull($log);
        $this->assertEquals($oldValues, $log->old_values);
        $this->assertEquals($newValues, $log->new_values);
        
        // Verify metadata contains response_type and responded_at
        $this->assertArrayHasKey('response_type', $log->metadata);
        $this->assertArrayHasKey('responded_at', $log->metadata);
        $this->assertEquals($responseType, $log->metadata['response_type']);
    }

    /** @test */
    public function it_captures_ip_address_from_request(): void
    {
        // Arrange
        $vendorUuid = 'vendor-uuid-789';
        $testIpAddress = '203.0.113.42';

        // Mock request with specific IP
        $this->mockRequest($testIpAddress, 'Test User Agent');

        // Act
        $this->auditLogService->logVendorLogin(
            $this->tenantId,
            $this->vendorUser->id,
            $vendorUuid
        );

        // Assert - Verify IP address is captured correctly
        $this->assertDatabaseHas('audit_logs', [
            'tenant_id' => $this->tenantId,
            'user_id' => $this->vendorUser->id,
            'action_type' => 'vendor.login',
            'ip_address' => $testIpAddress,
        ]);
    }

    /**
     * Helper method to mock HTTP request with IP and user agent
     */
    private function mockRequest(string $ipAddress, string $userAgent): void
    {
        $request = Request::create('/', 'GET', [], [], [], [
            'REMOTE_ADDR' => $ipAddress,
            'HTTP_USER_AGENT' => $userAgent,
        ]);

        // Bind the request to the container so request() helper uses it
        $this->app->instance('request', $request);
        
        // Also set it as the current request
        $this->app->bind('request', fn() => $request);
    }
}

