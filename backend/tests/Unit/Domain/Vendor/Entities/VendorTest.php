<?php

namespace Tests\Unit\Domain\Vendor\Entities;

use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Vendor\Events\VendorCreated;
use App\Domain\Vendor\Events\VendorUpdated;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class VendorTest extends TestCase
{
    private UuidValueObject $tenantId;
    private Address $address;
    private array $capabilities;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = UuidValueObject::generate();
        $this->address = new Address(
            'Jl. Industri No. 789',
            'Bekasi',
            'Jawa Barat',
            '17530',
            'ID'
        );
        $this->capabilities = ['metal_etching', 'glass_engraving', 'laser_cutting'];
    }

    /** @test */
    public function it_can_create_new_vendor()
    {
        // Act
        $vendor = Vendor::create(
            tenantId: $this->tenantId,
            name: 'John Smith',
            email: 'john@vendor.com',
            phone: '+62812345678',
            company: 'PT Vendor Industries',
            address: $this->address,
            capabilities: $this->capabilities,
            metadata: ['source' => 'referral']
        );

        // Assert
        $this->assertInstanceOf(Vendor::class, $vendor);
        $this->assertEquals($this->tenantId, $vendor->getTenantId());
        $this->assertEquals('John Smith', $vendor->getName());
        $this->assertEquals('john@vendor.com', $vendor->getEmail());
        $this->assertEquals('+62812345678', $vendor->getPhone());
        $this->assertEquals('PT Vendor Industries', $vendor->getCompany());
        $this->assertEquals($this->address, $vendor->getAddress());
        $this->assertEquals($this->capabilities, $vendor->getCapabilities());
        $this->assertEquals('active', $vendor->getStatus());
        $this->assertTrue($vendor->isActive());
        $this->assertEquals(0.0, $vendor->getPerformanceScore());
        
        // Check domain events
        $events = $vendor->getDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(VendorCreated::class, $events[0]);
    }

    /** @test */
    public function it_throws_exception_for_invalid_email()
    {
        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email format');
        
        Vendor::create(
            tenantId: $this->tenantId,
            name: 'John Smith',
            email: 'invalid-email',
            phone: '+62812345678',
            company: 'PT Vendor Industries',
            address: $this->address
        );
    }

    /** @test */
    public function it_initializes_quality_ratings_correctly()
    {
        // Act
        $vendor = $this->createTestVendor();

        // Assert
        $ratings = $vendor->getQualityRatings();
        $this->assertEquals(0.0, $ratings['overall_rating']);
        $this->assertEquals(0.0, $ratings['quality_score']);
        $this->assertEquals(0.0, $ratings['delivery_score']);
        $this->assertEquals(0.0, $ratings['communication_score']);
        $this->assertEquals(0, $ratings['total_orders']);
        $this->assertEquals(0, $ratings['completed_orders']);
    }

    /** @test */
    public function it_can_update_vendor_information()
    {
        // Arrange
        $vendor = $this->createTestVendor();
        $newAddress = new Address(
            'Jl. Manufaktur No. 456',
            'Tangerang',
            'Banten',
            '15140',
            'ID'
        );
        $newCapabilities = ['precision_machining', 'cnc_cutting'];

        // Act
        $vendor->update(
            name: 'Jane Smith',
            email: 'jane@vendor.com',
            phone: '+62887654321',
            company: 'PT New Vendor Corp',
            address: $newAddress,
            capabilities: $newCapabilities,
            metadata: ['source' => 'direct']
        );

        // Assert
        $this->assertEquals('Jane Smith', $vendor->getName());
        $this->assertEquals('jane@vendor.com', $vendor->getEmail());
        $this->assertEquals('+62887654321', $vendor->getPhone());
        $this->assertEquals('PT New Vendor Corp', $vendor->getCompany());
        $this->assertEquals($newAddress, $vendor->getAddress());
        $this->assertEquals($newCapabilities, $vendor->getCapabilities());
        $this->assertEquals(['source' => 'direct'], $vendor->getMetadata());
        
        // Check domain events
        $events = $vendor->getDomainEvents();
        $this->assertCount(2, $events); // VendorCreated + VendorUpdated
        $this->assertInstanceOf(VendorUpdated::class, $events[1]);
    }

    /** @test */
    public function it_can_update_quality_rating()
    {
        // Arrange
        $vendor = $this->createTestVendor();

        // Act
        $vendor->updateQualityRating(4.5, 4.0, 4.8);

        // Assert
        $ratings = $vendor->getQualityRatings();
        $this->assertEquals(4.43, $ratings['overall_rating']); // (4.5 + 4.0 + 4.8) / 3 = 4.43
        $this->assertEquals(4.5, $ratings['quality_score']);
        $this->assertEquals(4.0, $ratings['delivery_score']);
        $this->assertEquals(4.8, $ratings['communication_score']);
        $this->assertEquals(1, $ratings['total_orders']);
        $this->assertEquals(1, $ratings['completed_orders']);
        $this->assertEquals(4.43, $vendor->getPerformanceScore());
    }

    /** @test */
    public function it_calculates_weighted_average_for_multiple_ratings()
    {
        // Arrange
        $vendor = $this->createTestVendor();

        // Act - First rating
        $vendor->updateQualityRating(4.0, 4.0, 4.0);
        // Act - Second rating
        $vendor->updateQualityRating(5.0, 5.0, 5.0);

        // Assert
        $ratings = $vendor->getQualityRatings();
        $this->assertEquals(4.5, $ratings['overall_rating']); // Average of 4.0 and 5.0
        $this->assertEquals(4.5, $ratings['quality_score']);
        $this->assertEquals(4.5, $ratings['delivery_score']);
        $this->assertEquals(4.5, $ratings['communication_score']);
        $this->assertEquals(2, $ratings['total_orders']);
        $this->assertEquals(2, $ratings['completed_orders']);
    }

    /** @test */
    public function it_throws_exception_for_invalid_rating_values()
    {
        // Arrange
        $vendor = $this->createTestVendor();

        // Act & Assert - Rating too high
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Rating must be between 0 and 5');
        
        $vendor->updateQualityRating(6.0, 4.0, 4.0);
    }

    /** @test */
    public function it_throws_exception_for_negative_rating_values()
    {
        // Arrange
        $vendor = $this->createTestVendor();

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Rating must be between 0 and 5');
        
        $vendor->updateQualityRating(-1.0, 4.0, 4.0);
    }

    /** @test */
    public function it_can_deactivate_vendor()
    {
        // Arrange
        $vendor = $this->createTestVendor();
        $this->assertTrue($vendor->isActive());

        // Act
        $vendor->deactivate();

        // Assert
        $this->assertFalse($vendor->isActive());
        $this->assertEquals('inactive', $vendor->getStatus());
    }

    /** @test */
    public function it_throws_exception_when_deactivating_already_inactive_vendor()
    {
        // Arrange
        $vendor = $this->createTestVendor();
        $vendor->deactivate();

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor is already inactive');
        
        $vendor->deactivate();
    }

    /** @test */
    public function it_can_activate_vendor()
    {
        // Arrange
        $vendor = $this->createTestVendor();
        $vendor->deactivate();
        $this->assertFalse($vendor->isActive());

        // Act
        $vendor->activate();

        // Assert
        $this->assertTrue($vendor->isActive());
        $this->assertEquals('active', $vendor->getStatus());
    }

    /** @test */
    public function it_throws_exception_when_activating_already_active_vendor()
    {
        // Arrange
        $vendor = $this->createTestVendor();

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor is already active');
        
        $vendor->activate();
    }

    /** @test */
    public function it_can_check_capability_handling()
    {
        // Arrange
        $vendor = $this->createTestVendor();

        // Act & Assert
        $this->assertTrue($vendor->canHandle('metal_etching'));
        $this->assertTrue($vendor->canHandle('glass_engraving'));
        $this->assertTrue($vendor->canHandle('laser_cutting'));
        $this->assertFalse($vendor->canHandle('3d_printing'));
        $this->assertFalse($vendor->canHandle('nonexistent_capability'));
    }

    /** @test */
    public function it_creates_contact_info_from_email_and_phone()
    {
        // Act
        $vendor = $this->createTestVendor();

        // Assert
        $contactInfo = $vendor->getContactInfo();
        $this->assertEquals('john@vendor.com', $contactInfo->getEmail());
        $this->assertEquals('+62812345678', $contactInfo->getPhone());
    }

    /** @test */
    public function it_can_clear_domain_events()
    {
        // Arrange
        $vendor = $this->createTestVendor();
        $this->assertCount(1, $vendor->getDomainEvents());

        // Act
        $vendor->clearDomainEvents();

        // Assert
        $this->assertCount(0, $vendor->getDomainEvents());
    }

    /** @test */
    public function it_has_proper_timestamps()
    {
        // Act
        $vendor = $this->createTestVendor();

        // Assert
        $this->assertInstanceOf(\DateTimeImmutable::class, $vendor->getCreatedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $vendor->getUpdatedAt());
        $this->assertEquals($vendor->getCreatedAt(), $vendor->getUpdatedAt());
    }

    /** @test */
    public function it_updates_timestamp_when_modified()
    {
        // Arrange
        $vendor = $this->createTestVendor();
        $originalUpdatedAt = $vendor->getUpdatedAt();
        
        // Wait a moment to ensure timestamp difference
        usleep(1000);

        // Act
        $vendor->update(
            name: 'Jane Smith',
            email: 'jane@vendor.com',
            phone: '+62887654321',
            company: 'PT New Vendor Corp',
            address: $this->address
        );

        // Assert
        $this->assertGreaterThan($originalUpdatedAt, $vendor->getUpdatedAt());
    }

    private function createTestVendor(): Vendor
    {
        return Vendor::create(
            tenantId: $this->tenantId,
            name: 'John Smith',
            email: 'john@vendor.com',
            phone: '+62812345678',
            company: 'PT Vendor Industries',
            address: $this->address,
            capabilities: $this->capabilities,
            metadata: ['source' => 'referral']
        );
    }
}