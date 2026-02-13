<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\LogoutVendorCommand;
use App\Application\Vendor\UseCases\LogoutVendorUseCase;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class LogoutVendorUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private StubAuditLogRepository $auditLogRepository;
    private LogoutVendorUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->auditLogRepository = new StubAuditLogRepository();
        $this->useCase = new LogoutVendorUseCase($this->auditLogRepository);
    }

    /** @test */
    public function it_successfully_logs_out_vendor_by_revoking_token(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'vendor',
        ]);
        
        $token = $user->createToken('test-token', ['vendor:access']);
        $tokenId = $token->plainTextToken;
        
        $this->assertDatabaseHas('personal_access_tokens', [
            'tokenable_id' => $user->id,
            'tokenable_type' => 'App\Models\User',
        ]);

        $command = new LogoutVendorCommand($tenant->id, (string) $user->id, $tokenId);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertTrue($result);
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('vendor_logout', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_handles_logout_when_token_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $userId = '999';
        $tokenId = 'non-existent-token';

        $command = new LogoutVendorCommand($tenant->id, $userId, $tokenId);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertTrue($result);
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
    }

    /** @test */
    public function it_logs_audit_entry_on_logout(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'vendor',
        ]);
        
        $token = $user->createToken('test-token', ['vendor:access']);
        $tokenId = $token->plainTextToken;

        $command = new LogoutVendorCommand($tenant->id, (string) $user->id, $tokenId);

        // Act
        $this->useCase->execute($command);

        // Assert
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $log = $this->auditLogRepository->auditLogs[0];
        $this->assertEquals('vendor_logout', $log['action_type']);
        $this->assertEquals($user->id, $log['user_id']);
        $this->assertArrayHasKey('logout_at', $log['metadata']);
    }

    /** @test */
    public function it_logs_out_from_all_devices(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'vendor',
        ]);
        
        // Create multiple tokens
        $user->createToken('token-1', ['vendor:access']);
        $user->createToken('token-2', ['vendor:access']);
        $user->createToken('token-3', ['vendor:access']);
        
        $this->assertDatabaseCount('personal_access_tokens', 3);

        // Act
        $result = $this->useCase->logoutFromAllDevices((string) $user->id, $tenant->id);

        // Assert
        $this->assertEquals(3, $result);
        $this->assertDatabaseCount('personal_access_tokens', 0);
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('vendor_logout_all_devices', $this->auditLogRepository->auditLogs[0]['action_type']);
        $this->assertEquals(3, $this->auditLogRepository->auditLogs[0]['metadata']['tokens_revoked']);
    }

    /** @test */
    public function it_returns_zero_when_no_tokens_to_revoke(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'vendor',
        ]);

        // Act
        $result = $this->useCase->logoutFromAllDevices((string) $user->id, $tenant->id);

        // Assert
        $this->assertEquals(0, $result);
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
    }
}
