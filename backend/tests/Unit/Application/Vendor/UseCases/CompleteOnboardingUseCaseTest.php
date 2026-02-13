<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\CompleteOnboardingCommand;
use App\Application\Vendor\UseCases\CompleteOnboardingUseCase;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class CompleteOnboardingUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private StubAuditLogRepository $auditLogRepository;
    private CompleteOnboardingUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->auditLogRepository = new StubAuditLogRepository();
        $this->useCase = new CompleteOnboardingUseCase($this->auditLogRepository);
    }

    /** @test */
    public function it_successfully_completes_onboarding(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'onboarding_status' => 'in_progress',
            'portal_access_enabled' => true,
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
        ]);

        $command = new CompleteOnboardingCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals($vendor->id, $result['vendor_id']);
        $this->assertEquals($vendor->uuid, $result['vendor_uuid']);
        $this->assertEquals('completed', $result['onboarding_status']);
        $this->assertNotNull($result['onboarding_completed_at']);
        $this->assertTrue($result['portal_access_enabled']);
        
        // Verify database
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'onboarding_status' => 'completed',
        ]);
        
        // Verify onboarding_completed_at is set
        $updatedVendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::find($vendor->id);
        $this->assertNotNull($updatedVendor->onboarding_completed_at);
        
        // Verify audit log
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('vendor_onboarding_completed', $this->auditLogRepository->auditLogs[0]['action_type']);
        $this->assertEquals('in_progress', $this->auditLogRepository->auditLogs[0]['metadata']['old_status']);
        $this->assertEquals('completed', $this->auditLogRepository->auditLogs[0]['metadata']['new_status']);
    }

    /** @test */
    public function it_throws_exception_when_vendor_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();

        $command = new CompleteOnboardingCommand(
            vendorId: 99999,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_onboarding_not_in_progress(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'onboarding_status' => 'pending', // Not in_progress
        ]);

        $command = new CompleteOnboardingCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor onboarding is not in progress');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_already_completed(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'onboarding_status' => 'completed', // Already completed
            'onboarding_completed_at' => now()->subDays(1),
        ]);

        $command = new CompleteOnboardingCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor onboarding is not in progress');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_vendor_user_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'onboarding_status' => 'in_progress',
        ]);
        // No user account created

        $command = new CompleteOnboardingCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor user account not found');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_enforces_tenant_isolation(): void
    {
        // Arrange
        $tenant1 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $tenant2 = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant1->id,
            'onboarding_status' => 'in_progress',
        ]);

        $command = new CompleteOnboardingCommand(
            vendorId: $vendor->id,
            tenantId: $tenant2->id // Different tenant
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_sets_completion_timestamp(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'onboarding_status' => 'in_progress',
            'onboarding_completed_at' => null,
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
        ]);

        $command = new CompleteOnboardingCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id
        );

        $beforeExecution = now();

        // Act
        $result = $this->useCase->execute($command);

        $afterExecution = now();

        // Assert
        $completedAt = new \DateTime($result['onboarding_completed_at']);
        $this->assertGreaterThanOrEqual($beforeExecution->timestamp, $completedAt->getTimestamp());
        $this->assertLessThanOrEqual($afterExecution->timestamp, $completedAt->getTimestamp());
    }
}
