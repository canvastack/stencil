<?php

namespace App\Domain\Customer\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Customer\ValueObjects\CustomerName;
use App\Domain\Customer\ValueObjects\CustomerEmail;
use App\Domain\Customer\ValueObjects\CustomerPhone;
use App\Domain\Customer\ValueObjects\CustomerAddress;
use App\Domain\Customer\Enums\CustomerStatus;
use App\Domain\Customer\Enums\CustomerType;
use DateTime;

class Customer
{
    private UuidValueObject $id;
    private UuidValueObject $tenantId;
    private CustomerName $name;
    private CustomerEmail $email;
    private ?CustomerPhone $phone;
    private ?CustomerAddress $address;
    private CustomerStatus $status;
    private CustomerType $type;
    private ?string $company;
    private ?string $taxNumber;
    private ?string $notes;
    private array $tags;
    private ?DateTime $lastOrderAt;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        CustomerName $name,
        CustomerEmail $email,
        ?CustomerPhone $phone = null,
        ?CustomerAddress $address = null,
        CustomerStatus $status = CustomerStatus::ACTIVE,
        CustomerType $type = CustomerType::INDIVIDUAL,
        ?string $company = null,
        ?string $taxNumber = null,
        ?string $notes = null,
        array $tags = [],
        ?DateTime $lastOrderAt = null,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->name = $name;
        $this->email = $email;
        $this->phone = $phone;
        $this->address = $address;
        $this->status = $status;
        $this->type = $type;
        $this->company = $company;
        $this->taxNumber = $taxNumber;
        $this->notes = $notes;
        $this->tags = $tags;
        $this->lastOrderAt = $lastOrderAt;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();

        $this->validateBusinessRules();
    }

    public function getId(): UuidValueObject
    {
        return $this->id;
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getName(): CustomerName
    {
        return $this->name;
    }

    public function getEmail(): CustomerEmail
    {
        return $this->email;
    }

    public function getPhone(): ?CustomerPhone
    {
        return $this->phone;
    }

    public function getAddress(): ?CustomerAddress
    {
        return $this->address;
    }

    public function getStatus(): CustomerStatus
    {
        return $this->status;
    }

    public function getType(): CustomerType
    {
        return $this->type;
    }

    public function getCompany(): ?string
    {
        return $this->company;
    }

    public function getTaxNumber(): ?string
    {
        return $this->taxNumber;
    }

    public function getNotes(): ?string
    {
        return $this->notes;
    }

    public function getTags(): array
    {
        return $this->tags;
    }

    public function getLastOrderAt(): ?DateTime
    {
        return $this->lastOrderAt;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    public function updateName(CustomerName $name): self
    {
        $this->name = $name;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateEmail(CustomerEmail $email): self
    {
        $this->email = $email;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updatePhone(?CustomerPhone $phone): self
    {
        $this->phone = $phone;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateAddress(?CustomerAddress $address): self
    {
        $this->address = $address;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateStatus(CustomerStatus $status): self
    {
        $this->status = $status;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateType(CustomerType $type): self
    {
        $this->type = $type;
        $this->updatedAt = new DateTime();
        
        if ($type === CustomerType::INDIVIDUAL) {
            $this->company = null;
        }
        
        return $this;
    }

    public function updateCompany(?string $company): self
    {
        $this->company = $company;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateTaxNumber(?string $taxNumber): self
    {
        $this->taxNumber = $taxNumber;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateNotes(?string $notes): self
    {
        $this->notes = $notes;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function addTag(string $tag): self
    {
        $tag = trim($tag);
        
        if (!empty($tag) && !in_array($tag, $this->tags)) {
            $this->tags[] = $tag;
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function removeTag(string $tag): self
    {
        $index = array_search($tag, $this->tags);
        
        if ($index !== false) {
            array_splice($this->tags, $index, 1);
            $this->updatedAt = new DateTime();
        }
        
        return $this;
    }

    public function updateLastOrderAt(?DateTime $lastOrderAt = null): self
    {
        $this->lastOrderAt = $lastOrderAt ?? new DateTime();
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function activate(): self
    {
        $this->status = CustomerStatus::ACTIVE;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function suspend(): self
    {
        $this->status = CustomerStatus::SUSPENDED;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function isActive(): bool
    {
        return $this->status === CustomerStatus::ACTIVE;
    }

    public function isSuspended(): bool
    {
        return $this->status === CustomerStatus::SUSPENDED;
    }

    public function isBusiness(): bool
    {
        return $this->type === CustomerType::BUSINESS;
    }

    public function isIndividual(): bool
    {
        return $this->type === CustomerType::INDIVIDUAL;
    }

    public function hasOrdered(): bool
    {
        return $this->lastOrderAt !== null;
    }

    public function getDisplayName(): string
    {
        if ($this->isBusiness() && !empty($this->company)) {
            return $this->company . ' (' . $this->name->getFullName() . ')';
        }
        
        return $this->name->getFullName();
    }

    public function getDaysSinceLastOrder(): ?int
    {
        if ($this->lastOrderAt === null) {
            return null;
        }
        
        $now = new DateTime();
        $diff = $now->diff($this->lastOrderAt);
        
        return $diff->days;
    }

    private function validateBusinessRules(): void
    {
        if ($this->type === CustomerType::BUSINESS && empty($this->company)) {
            throw new \InvalidArgumentException('Business customers must have a company name');
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'name' => $this->name->getFullName(),
            'first_name' => $this->name->getFirstName(),
            'last_name' => $this->name->getLastName(),
            'email' => $this->email->getValue(),
            'phone' => $this->phone?->getValue(),
            'address' => $this->address?->toArray(),
            'status' => $this->status->value,
            'type' => $this->type->value,
            'company' => $this->company,
            'tax_number' => $this->taxNumber,
            'notes' => $this->notes,
            'tags' => $this->tags,
            'last_order_at' => $this->lastOrderAt?->format('Y-m-d H:i:s'),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}