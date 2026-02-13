<?php

declare(strict_types=1);

namespace Tests\Unit\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\UpdateVendorProfileCommand;
use App\Application\Vendor\UseCases\UpdateVendorProfileUseCase;
use Tests\Unit\Application\Quote\UseCases\StubAuditLogRepository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use InvalidArgumentException;
use Tests\TestCase;

class UpdateVendorProfileUseCaseTest extends TestCase
{
    use RefreshDatabase;

    private StubAuditLogRepository $auditLogRepository;
    private UpdateVendorProfileUseCase $useCase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->auditLogRepository = new StubAuditLogRepository();
        $this->useCase = new UpdateVendorProfileUseCase($this->auditLogRepository);
    }

    /** @test */
    public function it_successfully_updates_vendor_profile(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'old@example.com',
            'phone' => '081111111111',
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
        ]);

        $command = new UpdateVendorProfileCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            email: 'new@example.com',
            phone: '082222222222',
            contactPerson: 'John Doe',
            address: '123 Main St, Jakarta, DKI Jakarta 12345, Indonesia',
            location: [
                'city' => 'Jakarta',
                'state' => 'DKI Jakarta',
                'postal_code' => '12345',
                'country' => 'Indonesia',
                'latitude' => -6.2088,
                'longitude' => 106.8456,
            ]
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals('new@example.com', $result['email']);
        $this->assertEquals('082222222222', $result['phone']);
        $this->assertEquals('John Doe', $result['contact_person']);
        
        // Verify database
        $this->assertDatabaseHas('vendors', [
            'id' => $vendor->id,
            'email' => 'new@example.com',
            'phone' => '082222222222',
        ]);
        
        // Verify audit log
        $this->assertCount(1, $this->auditLogRepository->auditLogs);
        $this->assertEquals('vendor_profile_updated', $this->auditLogRepository->auditLogs[0]['action_type']);
    }

    /** @test */
    public function it_throws_exception_when_email_already_exists(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor1 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor1@example.com',
        ]);
        $vendor2 = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor2@example.com',
        ]);

        $command = new UpdateVendorProfileCommand(
            vendorId: $vendor1->id,
            tenantId: $tenant->id,
            email: 'vendor2@example.com' // Try to use vendor2's email
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Email already in use by another vendor');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_throws_exception_when_vendor_not_found(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();

        $command = new UpdateVendorProfileCommand(
            vendorId: 99999,
            tenantId: $tenant->id,
            email: 'test@example.com'
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
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
        ]);

        $command = new UpdateVendorProfileCommand(
            vendorId: $vendor->id,
            tenantId: $tenant2->id,
            email: 'test@example.com'
        );

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor not found');
        
        $this->useCase->execute($command);
    }

    /** @test */
    public function it_allows_partial_updates(): void
    {
        // Arrange
        $tenant = \App\Infrastructure\Persistence\Eloquent\Models\Tenant::factory()->create();
        $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::factory()->create([
            'tenant_id' => $tenant->id,
            'email' => 'vendor@example.com',
            'phone' => '081111111111',
            'contact_person' => 'Old Name',
        ]);
        
        $user = \App\Models\User::factory()->create([
            'tenant_id' => $tenant->id,
            'vendor_id' => $vendor->uuid,
            'account_type' => 'vendor',
        ]);

        // Only update phone
        $command = new UpdateVendorProfileCommand(
            vendorId: $vendor->id,
            tenantId: $tenant->id,
            phone: '082222222222'
        );

        // Act
        $result = $this->useCase->execute($command);

        // Assert
        $this->assertEquals('vendor@example.com', $result['email']); // Unchanged
        $this->assertEquals('082222222222', $result['phone']); // Changed
        $this->assertEquals('Old Name', $result['contact_person']); // Unchanged
    }
}
