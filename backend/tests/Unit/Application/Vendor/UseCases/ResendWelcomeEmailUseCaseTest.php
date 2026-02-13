<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\ResendWelcomeEmailCommand;
use App\Application\Vendor\UseCases\ResendWelcomeEmailUseCase;
use App\Infrastructure\Services\Email\EmailServiceInterface;
use App\Infrastructure\Services\Audit\AuditLogServiceInterface;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;
use Mockery;

class ResendWelcomeEmailUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private EmailServiceInterface $emailService;
    private AuditLogServiceInterface $auditLogService;
    private ResendWelcomeEmailUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->emailService = Mockery::mock(EmailServiceInterface::class);
        $this->auditLogService = Mockery::mock(AuditLogServiceInterface::class);
        $this->useCase = new ResendWelcomeEmailUseCase(
            $this->emailService,
            $this->auditLogService
        );
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    /** @test */
    public function it_successfully_resends_welcome_email(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'tenant',
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'company_name' => 'Test Vendor',
            'portal_access_enabled' => true,
            'onboarding_status' => 'in_progress',
        ]);
        
        // Create vendor user account
        $vendorUser = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
        ]);

        $command = new ResendWelcomeEmailCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Mock email service
        $this->emailService->shouldReceive('sendVendorWelcomeEmail')
            ->once()
            ->andReturn(true);

        // Mock audit log service
        $this->auditLogService->shouldReceive('logAction')
            ->once()
            ->andReturn(true);

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals($vendor->id, $result['vendor_id']);
        $this->assertEquals($vendor->uuid, $result['vendor_uuid']);
        $this->assertEquals('Test Vendor', $result['vendor_name']);
        $this->assertEquals('vendor@example.com', $result['vendor_email']);
        $this->assertTrue($result['email_sent']);
        $this->assertNotNull($result['welcome_email_sent_at']);
        
        // Verify welcome_email_sent_at was updated
        $updatedVendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::find($vendor->id);
        $this->assertNotNull($updatedVendor->welcome_email_sent_at);
    }

    /** @test */
    public function it_throws_exception_when_vendor_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new ResendWelcomeEmailCommand(
            vendorId: 99999,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_portal_access_not_enabled(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'portal_access_enabled' => false,
        ]);

        $command = new ResendWelcomeEmailCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor does not have portal access enabled');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_vendor_user_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'portal_access_enabled' => true,
        ]);
        // No vendor user created

        $command = new ResendWelcomeEmailCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
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
        
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant1->id,
        ]);
        
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant1->id,
            'portal_access_enabled' => true,
        ]);

        $command = new ResendWelcomeEmailCommand(
            vendorId: $vendor->id,
            tenantId: $tenant2->id, // Different tenant
            adminUserId: $admin->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_creates_password_reset_token(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'portal_access_enabled' => true,
        ]);
        
        $vendorUser = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
        ]);

        $command = new ResendWelcomeEmailCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Mock services
        $this->emailService->shouldReceive('sendVendorWelcomeEmail')
            ->once()
            ->andReturn(true);
        $this->auditLogService->shouldReceive('logAction')
            ->once()
            ->andReturn(true);

        // Act
        $result = $this->useCase->execute($command);

        // Assert - Verify password reset token was created
        $this->assertDatabaseHas('password_reset_tokens', [
            'email' => 'vendor@example.com',
        ]);
    }
}
