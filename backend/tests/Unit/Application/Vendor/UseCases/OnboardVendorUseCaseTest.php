<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\OnboardVendorCommand;
use App\Application\Vendor\UseCases\OnboardVendorUseCase;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;
use Tests\TestCase;

class OnboardVendorUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private StubAuditLogRepository $auditLogRepository;
    private OnboardVendorUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->auditLogRepository = new StubAuditLogRepository();
        $this->useCase = new OnboardVendorUseCase($this->auditLogRepository);
    }

    /** @test */
    public function it_successfully_onboards_vendor(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'platform',
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'contact_person' => 'John Doe',
            'onboarding_status' => 'pending',
            'portal_access_enabled' => false,
        ]);

        $command = new OnboardVendorCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id,
            sendWelcomeEmail: true
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals($vendor->id, $result['vendor_id']);
        $this->assertEquals($vendor->uuid, $result['vendor_uuid']);
        $this->assertEquals('in_progress', $result['onboarding_status']);
        $this->assertTrue($result['portal_access_enabled']);
        $this->assertTrue($result['welcome_email_sent']);
        $this->assertNotEmpty($result['temporary_password']);
        $this->assertIsString($result['temporary_password']);
        $this->assertEquals(12, strlen($result['temporary_password']));
        
        // Verify user account created
        $this->assertDatabaseHas('users', [
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'email' => 'vendor@example.com',
            'account_type' => 'vendor',
        ]);
        
        // Verify vendor updated
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'onboarding_status' => 'in_progress',
            'portal_access_enabled' => true,
        ]);
        
        // Verify audit log
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('vendor_onboarded', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_generates_secure_temporary_password(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'account_type' => 'platform',
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new OnboardVendorCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert - Password should have:
        $password = $result['temporary_password'];
        $this->assertEquals(12, strlen($password));
        $this->assertMatchesRegularExpression('/[A-Z]/', $password); // At least one uppercase
        $this->assertMatchesRegularExpression('/[a-z]/', $password); // At least one lowercase
        $this->assertMatchesRegularExpression('/[0-9]/', $password); // At least one number
        $this->assertMatchesRegularExpression('/[!@#$%^&*]/', $password); // At least one special char
        
        // Verify password is hashed in database
        $user = \App\Models\User::where('vendor_id', $vendor->uuid)->first();
        $this->assertTrue(Hash::check($password, $user->password));
    }

    /** @test */
    public function it_throws_exception_when_vendor_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new OnboardVendorCommand(
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
    public function it_throws_exception_when_vendor_already_has_user_account(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        // Create existing user account
        \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
        ]);

        $command = new OnboardVendorCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor already has a user account');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_email_already_in_use(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        
        // Create existing user with same email
        \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'account_type' => 'tenant',
        ]);
        
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
        ]);

        $command = new OnboardVendorCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Email already in use by another user');
        
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
        ]);

        $command = new OnboardVendorCommand(
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
    public function it_sets_temporary_password_expiration(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new OnboardVendorCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertNotNull($result['temporary_password_expires_at']);
        
        // Verify expiration is approximately 7 days from now
        $expiresAt = new \DateTime($result['temporary_password_expires_at']);
        $expectedExpiry = (new \DateTime())->modify('+7 days');
        $diff = abs($expiresAt->getTimestamp() - $expectedExpiry->getTimestamp());
        $this->assertLessThan(60, $diff); // Within 60 seconds
    }

    /** @test */
    public function it_allows_skipping_welcome_email(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $admin = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
        ]);
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
        ]);

        $command = new OnboardVendorCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            adminUserId: $admin->id,
            sendWelcomeEmail: false
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertFalse($result['welcome_email_sent']);
        
        // Verify welcome_email_sent_at is null
        $updatedVendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::find($vendor->id);
        $this->assertNull($updatedVendor->welcome_email_sent_at);
    }
}
