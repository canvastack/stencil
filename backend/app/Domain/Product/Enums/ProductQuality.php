<?php

namespace App\Domain\Product\Enums;

use InvalidArgumentException;
use App\Domain\Product\Enums\ProductMaterial;

enum ProductQuality: string
{
    case STANDARD = 'standard';
    case TINGGI = 'tinggi';
    case PREMIUM = 'premium';

    public function getDisplayName(): string
    {
        return match($this) {
            self::STANDARD => 'Standard',
            self::TINGGI => 'Tinggi',
            self::PREMIUM => 'Premium',
        };
    }

    public function getDescription(): string
    {
        return match($this) {
            self::STANDARD => 'Kualitas standar dengan presisi dasar dan finishing normal',
            self::TINGGI => 'Kualitas tinggi dengan presisi lebih baik dan finishing halus',
            self::PREMIUM => 'Kualitas premium dengan presisi maksimal dan finishing sempurna',
        };
    }

    public function getPricingMultiplier(): float
    {
        return match($this) {
            self::STANDARD => 1.0,
            self::TINGGI => 1.3,
            self::PREMIUM => 1.7,
        };
    }

    public function getPrecisionLevel(): string
    {
        return match($this) {
            self::STANDARD => '±0.2mm',
            self::TINGGI => '±0.1mm',
            self::PREMIUM => '±0.05mm',
        };
    }

    public function getSurfaceFinish(): string
    {
        return match($this) {
            self::STANDARD => 'Ra 3.2',
            self::TINGGI => 'Ra 1.6',
            self::PREMIUM => 'Ra 0.8',
        };
    }

    public function getInspectionLevel(): string
    {
        return match($this) {
            self::STANDARD => 'Visual',
            self::TINGGI => 'Dimensional + Visual',
            self::PREMIUM => 'Full CMM + Visual + Dimensional',
        };
    }

    public function getLeadTimeDays(): int
    {
        return match($this) {
            self::STANDARD => 3,
            self::TINGGI => 5,
            self::PREMIUM => 7,
        };
    }

    public function getMinimumOrderQuantity(): int
    {
        return match($this) {
            self::STANDARD => 1,
            self::TINGGI => 1,
            self::PREMIUM => 5,
        };
    }

    public function getAvailableFinishes(): array
    {
        return match($this) {
            self::STANDARD => ['basic', 'standard'],
            self::TINGGI => ['standard', 'fine', 'smooth'],
            self::PREMIUM => ['smooth', 'mirror', 'polished', 'custom'],
        };
    }

    public function getCertifications(): array
    {
        return match($this) {
            self::STANDARD => ['Basic QC'],
            self::TINGGI => ['ISO 9001', 'Dimensional Report'],
            self::PREMIUM => ['ISO 9001', 'AS9100', 'CMM Report', 'Material Certificate'],
        };
    }

    public function requiresSpecialTooling(): bool
    {
        return match($this) {
            self::STANDARD => false,
            self::TINGGI => false,
            self::PREMIUM => true,
        };
    }

    public function requiresQualityApproval(): bool
    {
        return match($this) {
            self::STANDARD => false,
            self::TINGGI => true,
            self::PREMIUM => true,
        };
    }

    public function includesDocumentation(): bool
    {
        return match($this) {
            self::STANDARD => false,
            self::TINGGI => true,
            self::PREMIUM => true,
        };
    }

    public function getEtchingDepthPrecision(): string
    {
        return match($this) {
            self::STANDARD => '±0.05mm',
            self::TINGGI => '±0.02mm',
            self::PREMIUM => '±0.01mm',
        };
    }

    public function getEdgeQuality(): string
    {
        return match($this) {
            self::STANDARD => 'Standard',
            self::TINGGI => 'Deburred',
            self::PREMIUM => 'Polished',
        };
    }

    public function calculatePrice(float $basePrice): float
    {
        return $basePrice * $this->getPricingMultiplier();
    }

    public static function fromString(string $value): self
    {
        return match($value) {
            'standard' => self::STANDARD,
            'tinggi' => self::TINGGI,
            'premium' => self::PREMIUM,
            default => throw new InvalidArgumentException("Invalid quality: {$value}")
        };
    }

    public static function getOptions(): array
    {
        $options = [];
        foreach (self::cases() as $case) {
            $options[$case->value] = $case->getDisplayName();
        }
        return $options;
    }

    public function isHigherThan(self $other): bool
    {
        return $this->getLevel() > $other->getLevel();
    }

    public function isLowerThan(self $other): bool
    {
        return $this->getLevel() < $other->getLevel();
    }

    public function getLevel(): int
    {
        return match($this) {
            self::STANDARD => 1,
            self::TINGGI => 2,
            self::PREMIUM => 3,
        };
    }

    public static function sortByLevel(array $qualities): array
    {
        usort($qualities, function($a, $b) {
            return $a->getLevel() <=> $b->getLevel();
        });
        return $qualities;
    }

    public static function getQualitiesAbove(self $quality): array
    {
        return array_filter(self::cases(), function($case) use ($quality) {
            return $case->getLevel() > $quality->getLevel();
        });
    }

    public static function getQualitiesBelow(self $quality): array
    {
        return array_filter(self::cases(), function($case) use ($quality) {
            return $case->getLevel() < $quality->getLevel();
        });
    }

    public function calculateUpgradeCost(float $basePrice, self $targetQuality): float
    {
        if ($this->getLevel() >= $targetQuality->getLevel()) {
            return 0.00;
        }
        
        $currentPrice = $this->calculatePrice($basePrice);
        $targetPrice = $targetQuality->calculatePrice($basePrice);
        
        return $targetPrice - $currentPrice;
    }

    public function getCompatibleMaterials(): array
    {
        // All qualities are compatible with all materials
        // but higher qualities might have additional requirements
        return ProductMaterial::cases();
    }

    public function isSuitableFor(string $application): bool
    {
        $suitableApplications = $this->getSuitableApplications();
        return in_array($application, $suitableApplications);
    }

    private function getSuitableApplications(): array
    {
        return match($this) {
            self::STANDARD => [
                'basic_signage', 'nameplates', 'labels', 'decorative_items'
            ],
            self::TINGGI => [
                'basic_signage', 'nameplates', 'labels', 'decorative_items',
                'precision_parts', 'industrial_components', 'automotive_parts'
            ],
            self::PREMIUM => [
                'basic_signage', 'nameplates', 'labels', 'decorative_items',
                'precision_parts', 'industrial_components', 'automotive_parts',
                'aerospace_components', 'medical_devices', 'precision_instruments'
            ],
        };
    }

    public function getRecommendedApplications(): array
    {
        return match($this) {
            self::STANDARD => ['signage', 'basic_nameplates', 'decorative_labels'],
            self::TINGGI => ['nameplates', 'industrial_tags', 'precision_marking'],
            self::PREMIUM => ['precision_instruments', 'aerospace_marking', 'medical_components'],
        };
    }

    // Legacy methods for compatibility
    public function getPriceMultiplier(): float
    {
        return $this->getPricingMultiplier();
    }

    public function getLeadTimeMultiplier(): float
    {
        return match($this) {
            self::STANDARD => 1.0,
            self::TINGGI => 1.3,
            self::PREMIUM => 1.7,
        };
    }

    public function getMinOrderQuantity(): int
    {
        return $this->getMinimumOrderQuantity();
    }

    public function getFeatures(): array
    {
        return match($this) {
            self::STANDARD => [
                'Etching dasar',
                'Finishing standar',
                'Presisi normal',
                'Waktu pengerjaan cepat',
            ],
            self::TINGGI => [
                'Etching detail tinggi',
                'Finishing premium',
                'Presisi tinggi',
                'Quality control ketat',
                'Garansi kualitas',
                'Kemasan premium',
            ],
            self::PREMIUM => [
                'Etching ultra-presisi',
                'Finishing sempurna',
                'Presisi maksimal',
                'Quality control ketat',
                'Garansi premium',
                'Kemasan mewah',
                'Sertifikat kualitas',
                'Support teknis',
            ],
        };
    }

    public function getTolerance(): string
    {
        return $this->getPrecisionLevel();
    }

    public static function getAllQualities(): array
    {
        return array_map(fn($case) => $case->value, self::cases());
    }

    public static function getDefault(): self
    {
        return self::STANDARD;
    }
}