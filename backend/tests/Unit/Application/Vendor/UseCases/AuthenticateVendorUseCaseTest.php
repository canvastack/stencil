<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\AuthenticateVendorCommand;
use App\Application\Vendor\UseCases\AuthenticateVendorUseCase;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel;
use Tests\Stubs\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class AuthenticateVendorUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private AuthenticateVendorUseCase $useCase;
    private VendorRepositoryInterface $vendorRepository;
    private StubAuditLogRepository $auditLogRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->vendorRepository = app(VendorRepositoryInterface::class);
        $this->auditLogRepository = new StubAuditLogRepository();
        $this->useCase = new AuthenticateVendorUseCase(
            $this->vendorRepository,
            $this->auditLogRepository
        );

        // Clear rate limiter before each test
        RateLimiter::clear('vendor-login:test@example.com:127.0.0.1');
    }

    /** @test */
    public function it_successfully_authenticates_vendor_with_valid_credentials(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now()->subDays(1),
        ]);

        $password = 'SecurePass123!';
        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make($password),
            'account_type' => 'vendor',
            'failed_login_attempts' => 0,
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: $password,
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertArrayHasKey('token', $result);
        $this->assertArrayHasKey('vendor', $result);
        $this->assertArrayHasKey('user', $result);
        $this->assertNotEmpty($result['token']);
        $this->assertEquals($vendor->uuid, $result['vendor']['id']);
        $this->assertEquals('vendor@example.com', $result['user']['email']);
        
        // Verify user record updated
        $user->refresh();
        $this->assertEquals(0, $user->failed_login_attempts);
        $this->assertNotNull($user->last_login_at);
        
        // Verify audit log created
        $this->assertCount(1, $this->auditLogRepository->logs);
        $this->assertEquals('vendor_login', $this->auditLogRepository->logs[0]['action_type']);
    }

    /** @test */
    public function it_throws_exception_for_invalid_credentials(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'account_type' => 'vendor',
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: 'WrongPassword',
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid credentials');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_user_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();

        $command = new AuthenticateVendorCommand(
            email: 'nonexistent@example.com',
            password: 'SomePassword123!',
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid credentials');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_locks_account_after_5_failed_attempts(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'account_type' => 'vendor',
            'failed_login_attempts' => 5,
            'last_failed_login_at' => now(),
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: 'CorrectPassword123!',
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Account is locked');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_portal_access_disabled(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => false, // Disabled
            'onboarding_status' => 'completed',
        ]);

        $password = 'SecurePass123!';
        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make($password),
            'account_type' => 'vendor',
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: $password,
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Portal access is not enabled');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_onboarding_not_completed(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'in_progress', // Not completed
        ]);

        $password = 'SecurePass123!';
        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make($password),
            'account_type' => 'vendor',
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: $password,
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Please complete your onboarding process first');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_vendor_inactive(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'inactive', // Inactive
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        $password = 'SecurePass123!';
        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make($password),
            'account_type' => 'vendor',
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: $password,
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act & Assert
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Your vendor account is inactive');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_generates_sanctum_token_on_successful_login(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now()->subDays(1),
        ]);

        $password = 'SecurePass123!';
        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make($password),
            'account_type' => 'vendor',
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: $password,
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertNotEmpty($result['token']);
        $this->assertIsString($result['token']);
        
        // Verify token exists in database
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_type' => UserEloquentModel::class,
            'tokenable_id' => $user->id,
            'name' => 'vendor-portal',
        ]);
    }

    /** @test */
    public function it_updates_portal_access_timestamp_on_successful_login(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now()->subDays(1),
            'portal_last_access_at' => null,
        ]);

        $password = 'SecurePass123!';
        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make($password),
            'account_type' => 'vendor',
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: $password,
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act
        $this->useCase->execute($command);

        // Assert
        $vendor->refresh();
        $this->assertNotNull($vendor->portal_last_access_at);
    }

    /** @test */
    public function it_clears_failed_attempts_on_successful_login(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now()->subDays(1),
        ]);

        $password = 'SecurePass123!';
        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make($password),
            'account_type' => 'vendor',
            'failed_login_attempts' => 3,
            'last_failed_login_at' => now()->subMinutes(5),
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: $password,
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act
        $this->useCase->execute($command);

        // Assert
        $user->refresh();
        $this->assertEquals(0, $user->failed_login_attempts);
        $this->assertNull($user->last_failed_login_at);
        $this->assertNotNull($user->last_login_at);
    }

    /** @test */
    public function it_increments_failed_attempts_on_wrong_password(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'status' => 'active',
            'portal_access_enabled' => true,
            'onboarding_status' => 'completed',
        ]);

        $user = UserEloquentModel::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid, // Use UUID string, not integer ID
            'email' => 'vendor@example.com',
            'password' => Hash::make('CorrectPassword123!'),
            'account_type' => 'vendor',
            'failed_login_attempts' => 0,
        ]);

        $command = new AuthenticateVendorCommand(
            email: 'vendor@example.com',
            password: 'WrongPassword',
            tenantId: $tenant->id,
            ipAddress: '127.0.0.1',
            userAgent: 'Test Browser'
        );

        // Act
        try {
            $this->useCase->execute($command);
        } catch (\InvalidArgumentException $e) {
            // Expected exception
        }

        // Assert
        $user->refresh();
        $this->assertEquals(1, $user->failed_login_attempts);
        $this->assertNotNull($user->last_failed_login_at);
    }
}
