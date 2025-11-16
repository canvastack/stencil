<?php

namespace App\Domain\Vendor\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Vendor\ValueObjects\VendorName;
use App\Domain\Vendor\ValueObjects\VendorEmail;
use App\Domain\Vendor\Enums\VendorStatus;
use DateTime;

class Vendor
{
    private UuidValueObject $id;
    private UuidValueObject $tenantId;
    private VendorName $name;
    private VendorEmail $email;
    private ?string $phone;
    private ?string $address;
    private VendorStatus $status;
    private ?string $contactPerson;
    private ?string $notes;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        VendorName $name,
        VendorEmail $email,
        ?string $phone = null,
        ?string $address = null,
        VendorStatus $status = VendorStatus::ACTIVE,
        ?string $contactPerson = null,
        ?string $notes = null,
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
        $this->contactPerson = $contactPerson;
        $this->notes = $notes;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();
    }

    public function getId(): UuidValueObject
    {
        return $this->id;
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getName(): VendorName
    {
        return $this->name;
    }

    public function getEmail(): VendorEmail
    {
        return $this->email;
    }

    public function getStatus(): VendorStatus
    {
        return $this->status;
    }

    public function updateStatus(VendorStatus $status): self
    {
        $this->status = $status;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function isActive(): bool
    {
        return $this->status === VendorStatus::ACTIVE;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'name' => $this->name->getValue(),
            'email' => $this->email->getValue(),
            'phone' => $this->phone,
            'address' => $this->address,
            'status' => $this->status->value,
            'contact_person' => $this->contactPerson,
            'notes' => $this->notes,
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}