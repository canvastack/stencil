<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\Vendor\Entities;

use PHPUnit\Framework\TestCase;
use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Address;
use InvalidArgumentException;
use DateTimeImmutable;

/**
 * Vendor Entity Tests
 * 
 * Tests the Vendor domain entity business logic.
 * Covers: portal access, onboarding workflow, business rules.
 * 
 * Requirements: 2.1, 2.5, 2.6, 17.1, 17.7, 23.1
 */
class VendorTest extends TestCase
{
    /** @test */
    public function it_enables_portal_access(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        
        // Act
        $vendor->enablePortalAccess();
        
        // Assert
        $this->assertTrue($vendor->isPortalAccessEnabled());
    }

    /** @test */
    public function it_disables_portal_access(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->enablePortalAccess();
        
        // Act
        $vendor->disablePortalAccess();
        
        // Assert
        $this->assertFalse($vendor->isPortalAccessEnabled());
    }

    /** @test */
    public function it_starts_onboarding_from_pending(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        
        // Act
        $vendor->startOnboarding();
        
        // Assert
        $this->assertTrue($vendor->isOnboardingInProgress());
        $this->assertFalse($vendor->isOnboardingPending());
        $this->assertFalse($vendor->isOnboardingCompleted());
    }

    /** @test */
    public function it_throws_exception_when_starting_onboarding_if_already_started(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->startOnboarding();
        
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Onboarding has already been started');
        
        // Act
        $vendor->startOnboarding();
    }

    /** @test */
    public function it_completes_onboarding(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->startOnboarding();
        $beforeComplete = new DateTimeImmutable();
        
        // Act
        $vendor->completeOnboarding();
        $afterComplete = new DateTimeImmutable();
        
        // Assert
        $this->assertTrue($vendor->isOnboardingCompleted());
        $this->assertFalse($vendor->isOnboardingInProgress());
        $this->assertNotNull($vendor->getOnboardingCompletedAt());
        $this->assertGreaterThanOrEqual($beforeComplete, $vendor->getOnboardingCompletedAt());
        $this->assertLessThanOrEqual($afterComplete, $vendor->getOnboardingCompletedAt());
    }

    /** @test */
    public function it_records_portal_access_timestamp(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $beforeAccess = new DateTimeImmutable();
        
        // Act
        $vendor->recordPortalAccess();
        $afterAccess = new DateTimeImmutable();
        
        // Assert
        $this->assertNotNull($vendor->getPortalLastAccessAt());
        $this->assertGreaterThanOrEqual($beforeAccess, $vendor->getPortalLastAccessAt());
        $this->assertLessThanOrEqual($afterAccess, $vendor->getPortalLastAccessAt());
    }

    /** @test */
    public function it_cannot_access_portal_without_enabled_flag(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->startOnboarding();
        $vendor->completeOnboarding();
        // Portal access not enabled
        
        // Act & Assert
        $this->assertFalse($vendor->canAccessPortal());
    }

    /** @test */
    public function it_cannot_access_portal_without_completed_onboarding(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->enablePortalAccess();
        // Onboarding still pending
        
        // Act & Assert
        $this->assertFalse($vendor->canAccessPortal());
    }

    /** @test */
    public function it_cannot_access_portal_if_inactive(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->enablePortalAccess();
        $vendor->startOnboarding();
        $vendor->completeOnboarding();
        $vendor->deactivate();
        
        // Act & Assert
        $this->assertFalse($vendor->canAccessPortal());
    }

    /** @test */
    public function it_can_access_portal_when_all_conditions_met(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->enablePortalAccess();
        $vendor->startOnboarding();
        $vendor->completeOnboarding();
        // Vendor is active by default
        
        // Act & Assert
        $this->assertTrue($vendor->canAccessPortal());
    }

    /** @test */
    public function it_updates_updated_at_when_enabling_portal_access(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $originalUpdatedAt = $vendor->getUpdatedAt();
        sleep(1); // Ensure time difference
        
        // Act
        $vendor->enablePortalAccess();
        
        // Assert
        $this->assertGreaterThan($originalUpdatedAt, $vendor->getUpdatedAt());
    }

    /** @test */
    public function it_updates_updated_at_when_disabling_portal_access(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->enablePortalAccess();
        $originalUpdatedAt = $vendor->getUpdatedAt();
        sleep(1); // Ensure time difference
        
        // Act
        $vendor->disablePortalAccess();
        
        // Assert
        $this->assertGreaterThan($originalUpdatedAt, $vendor->getUpdatedAt());
    }

    /** @test */
    public function it_updates_updated_at_when_completing_onboarding(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        $vendor->startOnboarding();
        $originalUpdatedAt = $vendor->getUpdatedAt();
        sleep(1); // Ensure time difference
        
        // Act
        $vendor->completeOnboarding();
        
        // Assert
        $this->assertGreaterThan($originalUpdatedAt, $vendor->getUpdatedAt());
    }

    /** @test */
    public function it_checks_onboarding_status_correctly(): void
    {
        // Arrange
        $vendor = $this->createVendor();
        
        // Assert - Initial state
        $this->assertTrue($vendor->isOnboardingPending());
        $this->assertFalse($vendor->isOnboardingInProgress());
        $this->assertFalse($vendor->isOnboardingCompleted());
        
        // Act - Start onboarding
        $vendor->startOnboarding();
        
        // Assert - In progress state
        $this->assertFalse($vendor->isOnboardingPending());
        $this->assertTrue($vendor->isOnboardingInProgress());
        $this->assertFalse($vendor->isOnboardingCompleted());
        
        // Act - Complete onboarding
        $vendor->completeOnboarding();
        
        // Assert - Completed state
        $this->assertFalse($vendor->isOnboardingPending());
        $this->assertFalse($vendor->isOnboardingInProgress());
        $this->assertTrue($vendor->isOnboardingCompleted());
    }

    /**
     * Helper method to create a test vendor
     */
    private function createVendor(): Vendor
    {
        return Vendor::create(
            tenantId: UuidValueObject::generate(),
            name: 'Test Vendor',
            email: 'vendor@test.com',
            phone: '+62812345678',
            company: 'Test Company',
            address: new Address(
                street: 'Jl. Test No. 123',
                city: 'Jakarta',
                state: 'DKI Jakarta',
                postalCode: '12345',
                country: 'ID' // ISO 3166-1 alpha-2 country code
            ),
            capabilities: ['etching', 'engraving'],
            metadata: []
        );
    }
}
