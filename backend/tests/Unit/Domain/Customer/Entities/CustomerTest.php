<?php

namespace Tests\Unit\Domain\Customer\Entities;

use App\Domain\Customer\Entities\Customer;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Customer\Events\CustomerCreated;
use App\Domain\Customer\Events\CustomerUpdated;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class CustomerTest extends TestCase
{
    private UuidValueObject $tenantId;
    private Address $address;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->tenantId = UuidValueObject::generate();
        $this->address = new Address(
            'Jl. Sudirman No. 123',
            'Jakarta Pusat',
            'DKI Jakarta',
            '10220',
            'ID'
        );
    }

    /** @test */
    public function it_can_create_new_customer()
    {
        // Act
        $customer = Customer::create(
            tenantId: $this->tenantId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+62812345678',
            company: 'PT Example',
            address: $this->address,
            metadata: ['source' => 'web']
        );

        // Assert
        $this->assertInstanceOf(Customer::class, $customer);
        $this->assertEquals($this->tenantId, $customer->getTenantId());
        $this->assertEquals('John Doe', $customer->getName());
        $this->assertEquals('john@example.com', $customer->getEmail());
        $this->assertEquals('+62812345678', $customer->getPhone());
        $this->assertEquals('PT Example', $customer->getCompany());
        $this->assertEquals($this->address, $customer->getAddress());
        $this->assertEquals('active', $customer->getStatus());
        $this->assertTrue($customer->isActive());
        $this->assertFalse($customer->hasOrders());
        
        // Check domain events
        $events = $customer->getDomainEvents();
        $this->assertCount(1, $events);
        $this->assertInstanceOf(CustomerCreated::class, $events[0]);
    }

    /** @test */
    public function it_throws_exception_for_invalid_email()
    {
        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email format');
        
        Customer::create(
            tenantId: $this->tenantId,
            name: 'John Doe',
            email: 'invalid-email',
            phone: '+62812345678'
        );
    }

    /** @test */
    public function it_can_update_customer_information()
    {
        // Arrange
        $customer = $this->createTestCustomer();
        $newAddress = new Address(
            'Jl. Thamrin No. 456',
            'Jakarta Pusat',
            'DKI Jakarta',
            '10230',
            'ID'
        );

        // Act
        $customer->update(
            name: 'Jane Doe',
            email: 'jane@example.com',
            phone: '+62887654321',
            company: 'PT New Company',
            address: $newAddress,
            metadata: ['source' => 'mobile']
        );

        // Assert
        $this->assertEquals('Jane Doe', $customer->getName());
        $this->assertEquals('jane@example.com', $customer->getEmail());
        $this->assertEquals('+62887654321', $customer->getPhone());
        $this->assertEquals('PT New Company', $customer->getCompany());
        $this->assertEquals($newAddress, $customer->getAddress());
        $this->assertEquals(['source' => 'mobile'], $customer->getMetadata());
        
        // Check domain events
        $events = $customer->getDomainEvents();
        $this->assertCount(2, $events); // CustomerCreated + CustomerUpdated
        $this->assertInstanceOf(CustomerUpdated::class, $events[1]);
    }

    /** @test */
    public function it_throws_exception_when_updating_with_invalid_email()
    {
        // Arrange
        $customer = $this->createTestCustomer();

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email format');
        
        $customer->update(
            name: 'Jane Doe',
            email: 'invalid-email',
            phone: '+62887654321'
        );
    }

    /** @test */
    public function it_can_deactivate_customer()
    {
        // Arrange
        $customer = $this->createTestCustomer();
        $this->assertTrue($customer->isActive());

        // Act
        $customer->deactivate();

        // Assert
        $this->assertFalse($customer->isActive());
        $this->assertEquals('inactive', $customer->getStatus());
    }

    /** @test */
    public function it_throws_exception_when_deactivating_already_inactive_customer()
    {
        // Arrange
        $customer = $this->createTestCustomer();
        $customer->deactivate();

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Customer is already inactive');
        
        $customer->deactivate();
    }

    /** @test */
    public function it_can_activate_customer()
    {
        // Arrange
        $customer = $this->createTestCustomer();
        $customer->deactivate();
        $this->assertFalse($customer->isActive());

        // Act
        $customer->activate();

        // Assert
        $this->assertTrue($customer->isActive());
        $this->assertEquals('active', $customer->getStatus());
    }

    /** @test */
    public function it_throws_exception_when_activating_already_active_customer()
    {
        // Arrange
        $customer = $this->createTestCustomer();

        // Act & Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Customer is already active');
        
        $customer->activate();
    }

    /** @test */
    public function it_can_record_last_order()
    {
        // Arrange
        $customer = $this->createTestCustomer();
        $this->assertFalse($customer->hasOrders());
        $this->assertNull($customer->getLastOrderAt());

        // Act
        $customer->recordLastOrder();

        // Assert
        $this->assertTrue($customer->hasOrders());
        $this->assertNotNull($customer->getLastOrderAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $customer->getLastOrderAt());
    }

    /** @test */
    public function it_creates_contact_info_from_email_and_phone()
    {
        // Act
        $customer = $this->createTestCustomer();

        // Assert
        $contactInfo = $customer->getContactInfo();
        $this->assertEquals('john@example.com', $contactInfo->getEmail());
        $this->assertEquals('+62812345678', $contactInfo->getPhone());
    }

    /** @test */
    public function it_can_clear_domain_events()
    {
        // Arrange
        $customer = $this->createTestCustomer();
        $this->assertCount(1, $customer->getDomainEvents());

        // Act
        $customer->clearDomainEvents();

        // Assert
        $this->assertCount(0, $customer->getDomainEvents());
    }

    /** @test */
    public function it_has_proper_timestamps()
    {
        // Act
        $customer = $this->createTestCustomer();

        // Assert
        $this->assertInstanceOf(\DateTimeImmutable::class, $customer->getCreatedAt());
        $this->assertInstanceOf(\DateTimeImmutable::class, $customer->getUpdatedAt());
        $this->assertEquals($customer->getCreatedAt(), $customer->getUpdatedAt());
    }

    /** @test */
    public function it_updates_timestamp_when_modified()
    {
        // Arrange
        $customer = $this->createTestCustomer();
        $originalUpdatedAt = $customer->getUpdatedAt();
        
        // Wait a moment to ensure timestamp difference
        usleep(1000);

        // Act
        $customer->update(
            name: 'Jane Doe',
            email: 'jane@example.com'
        );

        // Assert
        $this->assertGreaterThan($originalUpdatedAt, $customer->getUpdatedAt());
    }

    private function createTestCustomer(): Customer
    {
        return Customer::create(
            tenantId: $this->tenantId,
            name: 'John Doe',
            email: 'john@example.com',
            phone: '+62812345678',
            company: 'PT Example',
            address: $this->address,
            metadata: ['source' => 'web']
        );
    }
}