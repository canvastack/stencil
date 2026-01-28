<?php

namespace App\Domain\Vendor\ValueObjects;

use App\Domain\Shared\ValueObjects\Timeline;

/**
 * Order Requirements Value Object
 * 
 * Represents the requirements for an order that vendors need to fulfill
 */
class OrderRequirements
{
    public function __construct(
        private string $material,
        private int $quantity,
        private array $specifications,
        private Timeline $timeline,
        private array $qualityRequirements = [],
        private array $deliveryRequirements = [],
        private ?string $complexity = 'medium',
        private array $metadata = []
    ) {}
    
    // Getters
    public function getMaterial(): string { return $this->material; }
    public function getQuantity(): int { return $this->quantity; }
    public function getSpecifications(): array { return $this->specifications; }
    public function getTimeline(): Timeline { return $this->timeline; }
    public function getQualityRequirements(): array { return $this->qualityRequirements; }
    public function getDeliveryRequirements(): array { return $this->deliveryRequirements; }
    public function getComplexity(): string { return $this->complexity; }
    public function getMetadata(): array { return $this->metadata; }
    
    /**
     * Get required equipment based on specifications
     */
    public function getRequiredEquipment(): array
    {
        $equipment = [];
        
        // Determine equipment based on material and specifications
        switch (strtolower($this->material)) {
            case 'steel':
            case 'stainless steel':
                $equipment[] = 'laser_engraver';
                $equipment[] = 'cnc_machine';
                break;
            case 'aluminum':
                $equipment[] = 'laser_engraver';
                $equipment[] = 'anodizing_equipment';
                break;
            case 'glass':
                $equipment[] = 'glass_engraver';
                $equipment[] = 'sandblasting_equipment';
                break;
            case 'acrylic':
                $equipment[] = 'laser_cutter';
                $equipment[] = 'cnc_router';
                break;
            default:
                $equipment[] = 'general_engraver';
        }
        
        // Add equipment based on specifications
        if (isset($this->specifications['finish']) && $this->specifications['finish'] === 'anodized') {
            $equipment[] = 'anodizing_equipment';
        }
        
        if (isset($this->specifications['coating'])) {
            $equipment[] = 'coating_equipment';
        }
        
        return array_unique($equipment);
    }
    
    /**
     * Get estimated production time in days
     */
    public function getEstimatedProductionTime(): int
    {
        $baseTime = match($this->complexity) {
            'simple' => 3,
            'medium' => 7,
            'high' => 14,
            'custom' => 21,
            default => 7
        };
        
        // Adjust based on quantity
        $quantityMultiplier = match(true) {
            $this->quantity <= 10 => 1.0,
            $this->quantity <= 50 => 1.2,
            $this->quantity <= 100 => 1.5,
            $this->quantity <= 500 => 2.0,
            default => 3.0
        };
        
        return (int) ceil($baseTime * $quantityMultiplier);
    }
    
    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'material' => $this->material,
            'quantity' => $this->quantity,
            'specifications' => $this->specifications,
            'timeline' => $this->timeline->toArray(),
            'quality_requirements' => $this->qualityRequirements,
            'delivery_requirements' => $this->deliveryRequirements,
            'complexity' => $this->complexity,
            'required_equipment' => $this->getRequiredEquipment(),
            'estimated_production_time' => $this->getEstimatedProductionTime(),
            'metadata' => $this->metadata
        ];
    }
}