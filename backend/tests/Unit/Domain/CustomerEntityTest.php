<?php

namespace Tests\Unit\Domain;

use Tests\TestCase;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\ContactInfo;
use DateTimeImmutable;
use InvalidArgumentException;

class CustomerEntityTest extends TestCase
{
    /** @test */
    public function it_can_be_created_with_valid_data(): void
    {
        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        $name = 'John Doe';
        $email = 'john.doe@example.com';

        $customer = Customer::create($tenantId, $name, $email);

        $this->assertInstanceOf(UuidValueObject::class, $customer->getId());
        $this->assertEquals($tenantId, $customer->getTenantId());
        $this->assertEquals($name, $customer->getName());
        $this->assertEquals($email, $customer->getEmail());
        $this->assertEquals('active', $customer->getStatus());
        $this->assertInstanceOf(DateTimeImmutable::class, $customer->getCreatedAt());
        $this->assertInstanceOf(DateTimeImmutable::class, $customer->getUpdatedAt());
    }

    /** @test */
    public function it_can_be_created_with_optional_fields(): void
    {
        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        $name = 'John Doe';
        $email = 'john.doe@example.com';
        $phone = '+62123456789';
        $company = 'Test Company Ltd';
        $address = new Address('Jl. Sudirman No. 1', 'Jakarta', 'DKI Jakarta', '10270', 'ID');

        $customer = Customer::create($tenantId, $name, $email, $phone, $company, $address);

        $this->assertEquals($phone, $customer->getPhone());
        $this->assertEquals($company, $customer->getCompany());
        $this->assertEquals($address, $customer->getAddress());
    }

    /** @test */
    public function it_validates_email_format(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email format');

        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        Customer::create($tenantId, 'John Doe', 'invalid-email');
    }

    /** @test */
    public function it_can_update_customer_information(): void
    {
        $customer = $this->createCustomer();
        $newName = 'Jane Smith';
        $newEmail = 'jane.smith@example.com';
        $newPhone = '+62987654321';
        $newCompany = 'New Company Ltd';

        $customer->update($newName, $newEmail, $newPhone, $newCompany);

        $this->assertEquals($newName, $customer->getName());
        $this->assertEquals($newEmail, $customer->getEmail());
        $this->assertEquals($newPhone, $customer->getPhone());
        $this->assertEquals($newCompany, $customer->getCompany());
    }

    /** @test */
    public function it_validates_email_format_on_update(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Invalid email format');

        $customer = $this->createCustomer();
        $customer->update('Jane Smith', 'invalid-email');
    }

    /** @test */
    public function it_can_be_deactivated(): void
    {
        $customer = $this->createCustomer();

        $customer->deactivate();

        $this->assertEquals('inactive', $customer->getStatus());
        $this->assertFalse($customer->isActive());
    }

    /** @test */
    public function it_can_be_activated(): void
    {
        $customer = $this->createCustomer();
        $customer->deactivate();

        $customer->activate();

        $this->assertEquals('active', $customer->getStatus());
        $this->assertTrue($customer->isActive());
    }

    /** @test */
    public function it_prevents_deactivating_already_inactive_customer(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Customer is already inactive');

        $customer = $this->createCustomer();
        $customer->deactivate();
        $customer->deactivate(); // Should throw exception
    }

    /** @test */
    public function it_prevents_activating_already_active_customer(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Customer is already active');

        $customer = $this->createCustomer();
        $customer->activate(); // Should throw exception
    }

    /** @test */
    public function it_can_record_last_order(): void
    {
        $customer = $this->createCustomer();
        $this->assertFalse($customer->hasOrders());

        $customer->recordLastOrder();

        $this->assertTrue($customer->hasOrders());
        $this->assertInstanceOf(DateTimeImmutable::class, $customer->getLastOrderAt());
    }

    /** @test */
    public function it_can_be_reconstituted_from_persistence_data(): void
    {
        $id = new UuidValueObject('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        $name = 'John Doe';
        $email = 'john.doe@example.com';
        $phone = '+62123456789';
        $company = 'Test Company';
        $address = [
            'street' => 'Jl. Sudirman No. 1',
            'city' => 'Jakarta',
            'state' => 'DKI Jakarta',
            'postal_code' => '10270',
            'country' => 'ID'
        ];
        $contactInfo = [
            'email' => $email,
            'phone' => $phone
        ];
        $preferences = [];
        $metadata = ['source' => 'web'];
        $status = 'active';
        $createdAt = new DateTimeImmutable('2024-01-01');
        $updatedAt = new DateTimeImmutable('2024-01-02');

        $customer = Customer::reconstitute(
            $id,
            $tenantId,
            $name,
            $email,
            $phone,
            $company,
            $address,
            $contactInfo,
            $preferences,
            $metadata,
            $status,
            $createdAt,
            $updatedAt
        );

        $this->assertEquals($id, $customer->getId());
        $this->assertEquals($tenantId, $customer->getTenantId());
        $this->assertEquals($name, $customer->getName());
        $this->assertEquals($email, $customer->getEmail());
        $this->assertEquals($phone, $customer->getPhone());
        $this->assertEquals($company, $customer->getCompany());
        $this->assertEquals($status, $customer->getStatus());
        $this->assertEquals($createdAt, $customer->getCreatedAt());
        $this->assertEquals($updatedAt, $customer->getUpdatedAt());
        $this->assertInstanceOf(Address::class, $customer->getAddress());
        $this->assertInstanceOf(ContactInfo::class, $customer->getContactInfo());
    }

    private function createCustomer(): Customer
    {
        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        return Customer::create($tenantId, 'John Doe', 'john.doe@example.com');
    }
}