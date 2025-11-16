<?php

namespace Tests\Unit\Domain;

use Tests\TestCase;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Customer\ValueObjects\CustomerName;
use App\Domain\Customer\ValueObjects\CustomerEmail;
use App\Domain\Customer\ValueObjects\CustomerPhone;
use App\Domain\Customer\ValueObjects\CustomerAddress;
use App\Domain\Customer\Enums\CustomerStatus;
use App\Domain\Customer\Enums\CustomerType;
use DateTime;
use InvalidArgumentException;

class CustomerEntityTest extends TestCase
{
    /** @test */
    public function it_can_be_created_with_valid_data(): void
    {
        $id = new UuidValueObject('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        $name = new CustomerName('John', 'Doe');
        $email = new CustomerEmail('john.doe@example.com');

        $customer = new Customer($id, $tenantId, $name, $email);

        $this->assertEquals($id, $customer->getId());
        $this->assertEquals($tenantId, $customer->getTenantId());
        $this->assertEquals($name, $customer->getName());
        $this->assertEquals($email, $customer->getEmail());
        $this->assertEquals(CustomerStatus::ACTIVE, $customer->getStatus());
        $this->assertEquals(CustomerType::INDIVIDUAL, $customer->getType());
    }

    /** @test */
    public function it_can_be_created_as_business_customer(): void
    {
        $customer = $this->createCustomer();
        
        $customer->updateType(CustomerType::BUSINESS);
        $customer->updateCompany('Test Company Ltd');

        $this->assertEquals(CustomerType::BUSINESS, $customer->getType());
        $this->assertEquals('Test Company Ltd', $customer->getCompany());
        $this->assertTrue($customer->isBusiness());
        $this->assertFalse($customer->isIndividual());
    }

    /** @test */
    public function business_customer_requires_company_name(): void
    {
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Business customers must have a company name');

        $id = new UuidValueObject('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        $name = new CustomerName('John', 'Doe');
        $email = new CustomerEmail('john.doe@example.com');

        // Create business customer without company name
        new Customer(
            $id,
            $tenantId, 
            $name,
            $email,
            null, // phone
            null, // address
            CustomerStatus::ACTIVE,
            CustomerType::BUSINESS, // Business type but no company
            null // company is null
        );
    }

    /** @test */
    public function it_can_update_name(): void
    {
        $customer = $this->createCustomer();
        $newName = new CustomerName('Jane', 'Smith');

        $customer->updateName($newName);

        $this->assertEquals($newName, $customer->getName());
        $this->assertEquals('Jane Smith', $customer->getName()->getFullName());
    }

    /** @test */
    public function it_can_update_email(): void
    {
        $customer = $this->createCustomer();
        $newEmail = new CustomerEmail('jane.smith@example.com');

        $customer->updateEmail($newEmail);

        $this->assertEquals($newEmail, $customer->getEmail());
        $this->assertEquals('jane.smith@example.com', $customer->getEmail()->getValue());
    }

    /** @test */
    public function it_can_add_and_remove_tags(): void
    {
        $customer = $this->createCustomer();

        $customer->addTag('vip');
        $customer->addTag('wholesale');

        $this->assertContains('vip', $customer->getTags());
        $this->assertContains('wholesale', $customer->getTags());

        $customer->removeTag('vip');

        $this->assertNotContains('vip', $customer->getTags());
        $this->assertContains('wholesale', $customer->getTags());
    }

    /** @test */
    public function it_prevents_duplicate_tags(): void
    {
        $customer = $this->createCustomer();

        $customer->addTag('vip');
        $customer->addTag('vip'); // Duplicate

        $tags = $customer->getTags();
        $this->assertCount(1, $tags);
        $this->assertEquals(['vip'], $tags);
    }

    /** @test */
    public function it_can_suspend_and_activate(): void
    {
        $customer = $this->createCustomer();

        $customer->suspend();
        $this->assertTrue($customer->isSuspended());
        $this->assertFalse($customer->isActive());

        $customer->activate();
        $this->assertTrue($customer->isActive());
        $this->assertFalse($customer->isSuspended());
    }

    /** @test */
    public function it_can_update_last_order_date(): void
    {
        $customer = $this->createCustomer();
        $orderDate = new DateTime('2024-01-15');

        $customer->updateLastOrderAt($orderDate);

        $this->assertEquals($orderDate, $customer->getLastOrderAt());
        $this->assertTrue($customer->hasOrdered());
    }

    /** @test */
    public function it_can_calculate_days_since_last_order(): void
    {
        $customer = $this->createCustomer();
        $lastOrderDate = new DateTime('-30 days');

        $customer->updateLastOrderAt($lastOrderDate);

        $daysSinceLastOrder = $customer->getDaysSinceLastOrder();
        $this->assertEquals(30, $daysSinceLastOrder);
    }

    /** @test */
    public function it_returns_null_for_days_since_last_order_when_no_orders(): void
    {
        $customer = $this->createCustomer();

        $daysSinceLastOrder = $customer->getDaysSinceLastOrder();
        $this->assertNull($daysSinceLastOrder);
        $this->assertFalse($customer->hasOrdered());
    }

    /** @test */
    public function it_generates_correct_display_name_for_individual(): void
    {
        $customer = $this->createCustomer();

        $displayName = $customer->getDisplayName();
        $this->assertEquals('John Doe', $displayName);
    }

    /** @test */
    public function it_generates_correct_display_name_for_business(): void
    {
        $customer = $this->createCustomer();
        $customer->updateType(CustomerType::BUSINESS);
        $customer->updateCompany('Test Company Ltd');

        $displayName = $customer->getDisplayName();
        $this->assertEquals('Test Company Ltd (John Doe)', $displayName);
    }

    /** @test */
    public function it_can_update_phone(): void
    {
        $customer = $this->createCustomer();
        $phone = new CustomerPhone('081234567890');

        $customer->updatePhone($phone);

        $this->assertEquals($phone, $customer->getPhone());
        $this->assertEquals('81234567890', $customer->getPhone()->getValue());
    }

    /** @test */
    public function it_can_update_address(): void
    {
        $customer = $this->createCustomer();
        $address = new CustomerAddress(
            'Jl. Sudirman No. 1',
            'Jakarta',
            'DKI Jakarta',
            '10270',
            'Indonesia'
        );

        $customer->updateAddress($address);

        $this->assertEquals($address, $customer->getAddress());
        $this->assertEquals('Jakarta, DKI Jakarta', $customer->getAddress()->getShortAddress());
    }

    /** @test */
    public function it_can_convert_to_array(): void
    {
        $customer = $this->createCustomer();
        $customer->addTag('vip');
        $customer->updateLastOrderAt(new DateTime('2024-01-15'));

        $array = $customer->toArray();

        $this->assertIsArray($array);
        $this->assertArrayHasKey('id', $array);
        $this->assertArrayHasKey('tenant_id', $array);
        $this->assertArrayHasKey('name', $array);
        $this->assertArrayHasKey('first_name', $array);
        $this->assertArrayHasKey('last_name', $array);
        $this->assertArrayHasKey('email', $array);
        $this->assertArrayHasKey('status', $array);
        $this->assertArrayHasKey('type', $array);
        $this->assertArrayHasKey('tags', $array);
        $this->assertArrayHasKey('last_order_at', $array);

        $this->assertEquals('John Doe', $array['name']);
        $this->assertEquals('John', $array['first_name']);
        $this->assertEquals('Doe', $array['last_name']);
        $this->assertEquals('john.doe@example.com', $array['email']);
        $this->assertEquals('active', $array['status']);
        $this->assertEquals('individual', $array['type']);
        $this->assertEquals(['vip'], $array['tags']);
    }

    private function createCustomer(): Customer
    {
        $id = new UuidValueObject('123e4567-e89b-12d3-a456-426614174000');
        $tenantId = new UuidValueObject('987e6543-e21c-34d5-b678-123456789012');
        $name = new CustomerName('John', 'Doe');
        $email = new CustomerEmail('john.doe@example.com');

        return new Customer($id, $tenantId, $name, $email);
    }
}