<?php

namespace App\Domain\Vendor\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\ContactInfo;
use App\Domain\Shared\ValueObjects\Address;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Vendor\Events\VendorCreated;
use App\Domain\Vendor\Events\VendorUpdated;
use DateTimeImmutable;
use InvalidArgumentException;

/**
 * Vendor Entity
 * 
 * Core domain entity representing a vendor/supplier.
 * Encapsulates vendor business rules and maintains data consistency.
 * 
 * Database Integration:
 * - Maps to vendors table
 * - Uses existing field names and structures
 * - Maintains UUID for public identification
 */
class Vendor
{
    private array $domainEvents = [];

    private function __construct(
        private UuidValueObject $id,
        private UuidValueObject $tenantId,
        private string $name,
        private string $email,
        private ?string $phone,
        private string $company,
        private ?Address $address,
        private ContactInfo $contactInfo,
        private string $status,
        private array $capabilities,
        private array $qualityRatings,
        private array $metadata,
        private DateTimeImmutable $createdAt,
        private DateTimeImmutable $updatedAt
    ) {}

    /**
     * Create new vendor
     */
    public static function create(
        UuidValueObject $tenantId,
        string $name,
        string $email,
        ?string $phone,
        string $company,
        Address $address,
        array $capabilities = [],
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

        // Initialize quality ratings
        $qualityRatings = [
            'overall_rating' => 0.0,
            'quality_score' => 0.0,
            'delivery_score' => 0.0,
            'communication_score' => 0.0,
            'total_orders' => 0,
            'completed_orders' => 0,
        ];

        $vendor = new self(
            id: $id,
            tenantId: $tenantId,
            name: $name,
            email: $email,
            phone: $phone,
            company: $company,
            address: $address,
            contactInfo: $contactInfo,
            status: 'active',
            capabilities: $capabilities,
            qualityRatings: $qualityRatings,
            metadata: $metadata,
            createdAt: $now,
            updatedAt: $now
        );

        $vendor->addDomainEvent(new VendorCreated($vendor));
        
        return $vendor;
    }

    /**
     * Reconstitute vendor from persistence data
     */
    public static function reconstitute(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        string $name,
        string $email,
        ?string $phone,
        string $company,
        ?array $address,
        ?array $contactInfo,
        array $capabilities,
        array $certifications,
        float $rating,
        array $metadata,
        string $status,
        DateTimeImmutable $createdAt,
        DateTimeImmutable $updatedAt
    ): self {
        $addressObj = $address ? new Address(
            street: $address['street'],
            city: $address['city'],
            state: $address['state'],
            postalCode: $address['postal_code'],
            country: $address['country']
        ) : null;

        $contactInfoObj = $contactInfo ? new ContactInfo(
            email: $contactInfo['email'] ?? $email,
            phone: $contactInfo['phone'] ?? $phone,
            whatsapp: $contactInfo['whatsapp'] ?? null,
            alternativeEmail: $contactInfo['alternative_email'] ?? null,
            additionalContacts: $contactInfo['additional_contacts'] ?? []
        ) : new ContactInfo($email, $phone);

        // Initialize quality ratings with current rating
        $qualityRatings = [
            'overall_rating' => $rating,
            'quality_score' => $rating,
            'delivery_score' => $rating,
            'communication_score' => $rating,
            'total_orders' => 0,
            'completed_orders' => 0,
        ];

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
            capabilities: $capabilities,
            qualityRatings: $qualityRatings,
            metadata: $metadata,
            createdAt: $createdAt,
            updatedAt: $updatedAt
        );
    }

    /**
     * Update vendor information
     */
    public function update(
        string $name,
        string $email,
        ?string $phone,
        string $company,
        Address $address,
        array $capabilities = [],
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
        $this->capabilities = $capabilities;
        $this->metadata = $metadata;
        $this->updatedAt = new DateTimeImmutable();

        $this->addDomainEvent(new VendorUpdated($this));
    }

    /**
     * Update quality rating after order completion
     */
    public function updateQualityRating(
        float $qualityScore,
        float $deliveryScore,
        float $communicationScore
    ): void {
        $this->guardAgainstInvalidRating($qualityScore);
        $this->guardAgainstInvalidRating($deliveryScore);
        $this->guardAgainstInvalidRating($communicationScore);

        $totalOrders = $this->qualityRatings['total_orders'] + 1;
        $completedOrders = $this->qualityRatings['completed_orders'] + 1;

        // Calculate weighted average
        $currentQuality = $this->qualityRatings['quality_score'] * $this->qualityRatings['completed_orders'];
        $currentDelivery = $this->qualityRatings['delivery_score'] * $this->qualityRatings['completed_orders'];
        $currentCommunication = $this->qualityRatings['communication_score'] * $this->qualityRatings['completed_orders'];

        $newQualityScore = ($currentQuality + $qualityScore) / $completedOrders;
        $newDeliveryScore = ($currentDelivery + $deliveryScore) / $completedOrders;
        $newCommunicationScore = ($currentCommunication + $communicationScore) / $completedOrders;

        $overallRating = ($newQualityScore + $newDeliveryScore + $newCommunicationScore) / 3;

        $this->qualityRatings = [
            'overall_rating' => round($overallRating, 2),
            'quality_score' => round($newQualityScore, 2),
            'delivery_score' => round($newDeliveryScore, 2),
            'communication_score' => round($newCommunicationScore, 2),
            'total_orders' => $totalOrders,
            'completed_orders' => $completedOrders,
        ];

        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Deactivate vendor
     */
    public function deactivate(): void
    {
        $this->guardAgainstAlreadyInactive();
        
        $this->status = 'inactive';
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Activate vendor
     */
    public function activate(): void
    {
        $this->guardAgainstAlreadyActive();
        
        $this->status = 'active';
        $this->updatedAt = new DateTimeImmutable();
    }

    /**
     * Check if vendor can handle capability
     */
    public function canHandle(string $capability): bool
    {
        return in_array($capability, $this->capabilities);
    }

    /**
     * Check if vendor is active
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Get vendor performance score
     */
    public function getPerformanceScore(): float
    {
        return $this->qualityRatings['overall_rating'];
    }

    // Getters
    public function getId(): UuidValueObject { return $this->id; }
    public function getTenantId(): UuidValueObject { return $this->tenantId; }
    public function getName(): string { return $this->name; }
    public function getEmail(): string { return $this->email; }
    public function getPhone(): ?string { return $this->phone; }
    public function getCompany(): string { return $this->company; }
    public function getAddress(): ?Address { return $this->address; }
    public function getContactInfo(): ContactInfo { return $this->contactInfo; }
    public function getStatus(): string { return $this->status; }
    public function getCapabilities(): array { return $this->capabilities; }
    public function getQualityRatings(): array { return $this->qualityRatings; }
    public function getMetadata(): array { return $this->metadata; }
    public function getCreatedAt(): DateTimeImmutable { return $this->createdAt; }
    public function getUpdatedAt(): DateTimeImmutable { return $this->updatedAt; }

    /**
     * Get vendor rating (for backward compatibility with database field)
     */
    public function getRating(): float 
    { 
        return $this->qualityRatings['overall_rating'] ?? 0.0; 
    }

    /**
     * Get vendor specializations (maps to capabilities for domain consistency)
     */
    public function getSpecializations(): array 
    { 
        return $this->capabilities; 
    }

    /**
     * Get supported materials from metadata
     */
    public function getSupportedMaterials(): array
    {
        return $this->metadata['supported_materials'] ?? [];
    }

    /**
     * Get minimum order value from metadata
     */
    public function getMinimumOrderValue(): ?Money
    {
        $minOrder = $this->metadata['minimum_order_value'] ?? null;
        return $minOrder ? Money::fromCents($minOrder) : null;
    }

    /**
     * Check if vendor can produce specific material
     */
    public function canProduceMaterial(string $material): bool
    {
        $supportedMaterials = $this->getSupportedMaterials();
        return in_array(strtolower($material), array_map('strtolower', $supportedMaterials));
    }

    /**
     * Check if vendor is specialized in material
     */
    public function isSpecializedIn(string $material): bool
    {
        $specializations = $this->getSpecializations();
        return in_array(strtolower($material), array_map('strtolower', $specializations));
    }

    /**
     * Get available equipment from metadata
     */
    public function getAvailableEquipment(): array
    {
        return $this->metadata['available_equipment'] ?? [];
    }

    /**
     * Get current capacity utilization
     */
    public function getCurrentCapacityUtilization(): float
    {
        return $this->metadata['capacity_utilization'] ?? 0.5; // Default 50%
    }

    /**
     * Generate quote for order requirements
     */
    public function generateQuote(object $requirements): \App\Domain\Vendor\ValueObjects\VendorQuote
    {
        // This is a simplified quote generation
        // In real implementation, this would involve complex pricing logic
        
        $basePrice = $this->calculateBasePrice($requirements);
        $leadTime = $this->calculateLeadTime($requirements);
        
        return \App\Domain\Vendor\ValueObjects\VendorQuote::fromBasicPricing(
            vendorId: $this->id,
            totalPrice: $basePrice,
            leadTimeDays: $leadTime,
            paymentTerms: $this->getDefaultPaymentTerms()
        );
    }

    /**
     * Calculate base price for requirements
     */
    private function calculateBasePrice(object $requirements): Money
    {
        // Simplified pricing calculation
        $basePricePerUnit = Money::fromCents(50000); // 500 IDR base price
        $quantity = $requirements->getQuantity() ?? 1;
        
        return $basePricePerUnit->multiply($quantity);
    }

    /**
     * Calculate lead time for requirements
     */
    private function calculateLeadTime(object $requirements): int
    {
        $baseLeadTime = $this->metadata['base_lead_time'] ?? 14; // 14 days default
        $complexity = $requirements->getComplexity() ?? 'medium';
        
        $multiplier = match($complexity) {
            'simple' => 0.8,
            'medium' => 1.0,
            'high' => 1.5,
            'custom' => 2.0,
            default => 1.0
        };
        
        return (int) ($baseLeadTime * $multiplier);
    }

    /**
     * Get default payment terms
     */
    private function getDefaultPaymentTerms(): array
    {
        return $this->metadata['default_payment_terms'] ?? [
            'down_payment' => ['percentage' => 50, 'due_days' => 0],
            'final_payment' => ['percentage' => 50, 'due_days' => 14]
        ];
    }

    /**
     * Get credit score from metadata
     */
    public function getCreditScore(): int
    {
        return $this->metadata['credit_score'] ?? 650; // Default credit score
    }

    /**
     * Get payment history
     */
    public function getPaymentHistory(): object
    {
        return new class($this->metadata['payment_history'] ?? []) {
            public function __construct(private array $history) {}
            
            public function hasNoDelays(): bool {
                return ($this->history['delayed_payments'] ?? 0) === 0;
            }
            
            public function hasMinorDelays(): bool {
                return ($this->history['delayed_payments'] ?? 0) <= 2;
            }
        };
    }

    /**
     * Get total orders from quality ratings
     */
    public function getTotalOrders(): int
    {
        return $this->qualityRatings['total_orders'] ?? 0;
    }

    /**
     * Get lead time from metadata
     */
    public function getLeadTime(): int
    {
        return $this->metadata['lead_time'] ?? 14; // Default 14 days
    }

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
     * Guard against invalid rating
     */
    private function guardAgainstInvalidRating(float $rating): void
    {
        if ($rating < 0 || $rating > 5) {
            throw new InvalidArgumentException('Rating must be between 0 and 5');
        }
    }

    /**
     * Guard against already inactive vendor
     */
    private function guardAgainstAlreadyInactive(): void
    {
        if ($this->status === 'inactive') {
            throw new InvalidArgumentException('Vendor is already inactive');
        }
    }

    /**
     * Guard against already active vendor
     */
    private function guardAgainstAlreadyActive(): void
    {
        if ($this->status === 'active') {
            throw new InvalidArgumentException('Vendor is already active');
        }
    }
}