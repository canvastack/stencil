<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\RequestPasswordResetCommand;
use App\Application\Vendor\UseCases\RequestPasswordResetUseCase;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Tests\TestCase;

class RequestPasswordResetUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private StubAuditLogRepository $auditLogRepository;
    private RequestPasswordResetUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->auditLogRepository = new StubAuditLogRepository();
        
        $this->useCase = new RequestPasswordResetUseCase(
            $this->auditLogRepository
        );
    }

    /** @test */
    public function it_successfully_generates_reset_token_for_valid_vendor(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'status' => 'active',
            'onboarding_status' => 'completed',
            'portal_access_enabled' => true,
            'onboarding_completed_at' => now(),
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'vendor_id' => $vendor->uuid,
        ]);

        $command = new RequestPasswordResetCommand('vendor@example.com', (string) $tenant->id);

        // Act
        $token = $this->useCase->execute($command);

        // Assert
        $this->assertIsString($token);
        $this->assertEquals(64, strlen($token));
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'vendor@example.com',
        ]);
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_requested', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_throws_exception_when_user_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $command = new RequestPasswordResetCommand('nonexistent@example.com', (string) $tenant->id);

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('If an account exists with this email');
        
        $this->useCase->execute($command);
        
        // Verify audit log was created
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_request_failed', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_throws_exception_when_portal_access_disabled(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'status' => 'active',
            'onboarding_status' => 'completed',
            'portal_access_enabled' => false, // Disabled
            'onboarding_completed_at' => now(),
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'vendor_id' => $vendor->uuid,
        ]);

        $command = new RequestPasswordResetCommand('vendor@example.com', (string) $tenant->id);

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Portal access is not enabled');
        
        $this->useCase->execute($command);
        
        // Verify audit log was created
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('password_reset_request_denied', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_enforces_rate_limiting(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'status' => 'active',
            'onboarding_status' => 'completed',
            'portal_access_enabled' => true,
            'onboarding_completed_at' => now(),
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'vendor_id' => $vendor->uuid,
        ]);

        // Create a recent password reset token (within 60 seconds)
        DB::table('password_reset_tokens')->insert([
            'email' => 'vendor@example.com',
            'token' => hash('sha256', 'test-token'),
            'expires_at' => now()->addMinutes(60),
            'created_at' => now()->subSeconds(30), // 30 seconds ago
        ]);

        $command = new RequestPasswordResetCommand('vendor@example.com', (string) $tenant->id);

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Please wait before requesting another password reset');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_logs_audit_entry_on_successful_request(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'status' => 'active',
            'onboarding_status' => 'completed',
            'portal_access_enabled' => true,
            'onboarding_completed_at' => now(),
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
            'vendor_id' => $vendor->uuid,
        ]);

        $command = new RequestPasswordResetCommand('vendor@example.com', (string) $tenant->id);

        // Act
        $this->useCase->execute($command);

        // Assert
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $log = $this->auditLogRepository->auditLogs[0];
        $this->assertEquals('password_reset_requested', $log['action_type']);
        $this->assertEquals($user->id, $log['user_id']);
        $this->assertArrayHasKey('token_expires_at', $log['metadata']);
    }
}
