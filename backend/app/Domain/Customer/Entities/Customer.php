<?php

namespace App\Domain\Customer\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\ContactInfo;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Customer\Events\CustomerCreated;
use App\Domain\Customer\Events\CustomerUpdated;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Customer Entity
 * 
 * Core domain entity representing a customer.
 * Encapsulates customer business rules and maintains data consistency.
 * 
 * Database Integration:
 * - Maps to customers table
 * - Uses existing field names and structures
 * - Maintains UUID for public identification
 */
class Customer
{
    private array $domainEvents = [];

    private function __construct(
        private UuidValueObject $id,
        private UuidValueObject $tenantId,
        private string $name,
        private string $email,
        private ?string $phone,
        private ?string $company,
        private ?Address $address,
        private ContactInfo $contactInfo,
        private string $status,
        private array $metadata,
        private ?DateTimeImmutable $lastOrderAt,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt
    ) {}

    /**
     * Create new customer
     */
    public static function create(
        UuidValueObject $tenantId,
        string $name,
        string $email,
        ?string $phone = null,
        ?string $company = null,
        ?Address $address = null,
        array $metadata = []
    ): self {
        $id = UuidValueObject::generate();
        $now = new DateTimeImmutable();
        
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }

        // Create contact info
        $contactInfo = new ContactInfo($email, $phone);

        $customer = new self(
            id: $id,
            tenantId: $tenantId,
            name: $name,
            email: $email,
            phone: $phone,
            company: $company,
            address: $address,
            contactInfo: $contactInfo,
            status: 'active',
            metadata: $metadata,
            lastOrderAt: null,
            createdAt: $now,
            updatedAt: $now
        );

        $customer->addDomainEvent(new CustomerCreated($customer));
        
        return $customer;
    }

    /**
     * Reconstitute customer from persistence data
     */
    public static function reconstitute(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        string $name,
        string $email,
        ?string $phone,
        ?string $company,
        ?array $address,
        ?array $contactInfo,
        array $preferences,
        array $metadata,
        string $status,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        $addressObj = null;
        if ($address) {
            $addressObj = new Address(
                street: $address['street'],
                city: $address['city'],
                state: $address['state'],
                postalCode: $address['postal_code'],
                country: $address['country']
            );
        }

        $contactInfoObj = new ContactInfo(
            email: $contactInfo['email'] ?? $email,
            phone: $contactInfo['phone'] ?? $phone,
            whatsapp: $contactInfo['whatsapp'] ?? null,
            alternativeEmail: $contactInfo['alternative_email'] ?? null,
            additionalContacts: $contactInfo['additional_contacts'] ?? []
        );

        return new self(
            id: $id,
            tenantId: $tenantId,
            name: $name,
            email: $email,
            phone: $phone,
            company: $company,
            address: $addressObj,
            contactInfo: $contactInfoObj,
            status: $status,
            metadata: $metadata,
            lastOrderAt: null, // This would need to be passed if available
            createdAt: $createdAt,
            updatedAt: $updatedAt
        );
    }

    /**
     * Update customer information
     */
    public function update(
        string $name,
        string $email,
        ?string $phone = null,
        ?string $company = null,
        ?Address $address = null,
        array $metadata = []
    ): void {
        // Validate email format
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new InvalidArgumentException('Invalid email format');
        }

        $this->name = $name;
        $this->email = $email;
        $this->phone = $phone;
        $this->company = $company;
        $this->address = $address;
        $this->contactInfo = new ContactInfo($email, $phone);
        $this->metadata = $metadata;
        $this->updatedAt = new DateTimeImmutable();

        $this->addDomainEvent(new CustomerUpdated($this));
    }

    /**
     * Deactivate customer
     */
    public function deactivate(): void
    {
        $this->guardAgainstAlreadyInactive();
        
        $this->status = 'inactive';
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Activate customer
     */
    public function activate(): void
    {
        $this->guardAgainstAlreadyActive();
        
        $this->status = 'active';
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Record last order date
     */
    public function recordLastOrder(): void
    {
        $this->lastOrderAt = new DateTimeImmutable();
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Check if customer is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if customer has placed orders
     */
    public function hasOrders(): bool
    {
        return $this->lastOrderAt !== null;
    }

    /**
     * Get customer tier based on business rules
     */
    public function getTier(): string
    {
        // This would typically be calculated based on order history, spending, etc.
        // For now, return from metadata or default
        return $this->metadata['tier'] ?? 'standard';
    }

    /**
     * Get total orders count
     */
    public function getTotalOrders(): int
    {
        return $this->metadata['total_orders'] ?? 0;
    }

    /**
     * Get total spent amount
     */
    public function getTotalSpent(): \App\Domain\Shared\ValueObjects\Money
    {
        $totalSpent = $this->metadata['total_spent'] ?? 0;
        return \App\Domain\Shared\ValueObjects\Money::fromCents($totalSpent);
    }

    /**
     * Get customer age in months
     */
    public function getCustomerAgeInMonths(): int
    {
        $now = new DateTimeImmutable();
        $interval = $this->createdAt->diff($now);
        return ($interval->y * 12) + $interval->m;
    }

    /**
     * Get customer region
     */
    public function getRegion(): string
    {
        return $this->metadata['region'] ?? 'UNKNOWN';
    }

    /**
     * Check if customer is international
     */
    public function isInternational(): bool
    {
        return $this->metadata['is_international'] ?? false;
    }

    /**
     * Check if customer is government entity
     */
    public function isGovernment(): bool
    {
        return $this->metadata['is_government'] ?? false;
    }

    /**
     * Check if customer is export customer
     */
    public function isExportCustomer(): bool
    {
        return $this->metadata['is_export_customer'] ?? false;
    }

    /**
     * Check if customer is in free trade zone
     */
    public function isFreeTradeZone(): bool
    {
        return $this->metadata['is_free_trade_zone'] ?? false;
    }

    /**
     * Check if customer has special exemption
     */
    public function hasSpecialExemption(string $exemptionType): bool
    {
        $exemptions = $this->metadata['tax_exemptions'] ?? [];
        return in_array($exemptionType, $exemptions);
    }

    /**
     * Check if customer is corporate
     */
    public function isCorporate(): bool
    {
        return !empty($this->company) || ($this->metadata['customer_type'] ?? 'individual') === 'corporate';
    }

    /**
     * Get customer country
     */
    public function getCountry(): string
    {
        return $this->address?->getCountry() ?? $this->metadata['country'] ?? 'INDONESIA';
    }

    /**
     * Check if customer requires PPh Article 23
     */
    public function requiresPPhArticle23(): bool
    {
        return $this->metadata['requires_pph_article_23'] ?? false;
    }

    /**
     * Check if customer requires PPh Article 22
     */
    public function requiresPPhArticle22(): bool
    {
        return $this->metadata['requires_pph_article_22'] ?? false;
    }

    // Getters
    public function getId(): UuidValueObject { return $this->id; }
    public function getTenantId(): UuidValueObject { return $this->tenantId; }
    public function getName(): string { return $this->name; }
    public function getEmail(): string { return $this->email; }
    public function getPhone(): ?string { return $this->phone; }
    public function getCompany(): ?string { return $this->company; }
    public function getAddress(): ?Address { return $this->address; }
    public function getContactInfo(): ContactInfo { return $this->contactInfo; }
    public function getStatus(): string { return $this->status; }
    public function getMetadata(): array { return $this->metadata; }
    public function getLastOrderAt(): ?DateTimeImmutable { return $this->lastOrderAt; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): DateTimeImmutable { return $this->updatedAt; }

    /**
     * Get domain events
     */
    public function getDomainEvents(): array
    {
        return $this->domainEvents;
    }

    /**
     * Clear domain events
     */
    public function clearDomainEvents(): void
    {
        $this->domainEvents = [];
    }

    /**
     * Add domain event
     */
    private function addDomainEvent($event): void
    {
        $this->domainEvents[] = $event;
    }

    /**
     * Guard against already inactive customer
     */
    private function guardAgainstAlreadyInactive(): void
    {
        if ($this->status === 'inactive') {
            throw new InvalidArgumentException('Customer is already inactive');
        }
    }

    /**
     * Guard against already active customer
     */
    private function guardAgainstAlreadyActive(): void
    {
        if ($this->status === 'active') {
            throw new InvalidArgumentException('Customer is already active');
        }
    }
}