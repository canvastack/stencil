<?php

namespace App\Domain\Product\Enums;

use InvalidArgumentException;

enum ProductMaterial: string
{
    case AKRILIK = 'akrilik';
    case KUNINGAN = 'kuningan';
    case TEMBAGA = 'tembaga';
    case STAINLESS_STEEL = 'stainless_steel';
    case ALUMINUM = 'aluminum';

    public function getDisplayName(): string
    {
        return match($this) {
            self::AKRILIK => 'Akrilik',
            self::KUNINGAN => 'Kuningan',
            self::TEMBAGA => 'Tembaga',
            self::STAINLESS_STEEL => 'Stainless Steel',
            self::ALUMINUM => 'Aluminum',
        };
    }

    public function getDescription(): string
    {
        return match($this) {
            self::AKRILIK => 'Bahan plastik akrilik berkualitas tinggi, tahan lama dan mudah dibentuk',
            self::KUNINGAN => 'Logam kuningan dengan daya tahan tinggi dan tampilan elegan',
            self::TEMBAGA => 'Logam tembaga murni dengan konduktivitas tinggi',
            self::STAINLESS_STEEL => 'Stainless steel anti karat dengan kekuatan maksimal',
            self::ALUMINUM => 'Aluminum ringan dan tahan korosi untuk berbagai aplikasi',
        };
    }

    public function getPricingMultiplier(): float
    {
        return match($this) {
            self::AKRILIK => 1.0,
            self::KUNINGAN => 1.8,
            self::TEMBAGA => 2.2,
            self::STAINLESS_STEEL => 2.5,
            self::ALUMINUM => 1.5,
        };
    }

    public function isMetal(): bool
    {
        return match($this) {
            self::AKRILIK => false,
            default => true,
        };
    }

    public function isPlastic(): bool
    {
        return match($this) {
            self::AKRILIK => true,
            default => false,
        };
    }

    public function getDensity(): float
    {
        return match($this) {
            self::AKRILIK => 1.18, // g/cm³
            self::KUNINGAN => 8.73,
            self::TEMBAGA => 8.96,
            self::STAINLESS_STEEL => 7.93,
            self::ALUMINUM => 2.70,
        };
    }

    public function getMeltingPoint(): int
    {
        return match($this) {
            self::AKRILIK => 160, // °C
            self::KUNINGAN => 900,
            self::TEMBAGA => 1085,
            self::STAINLESS_STEEL => 1400,
            self::ALUMINUM => 660,
        };
    }

    public function getHardnessLevel(): string
    {
        return match($this) {
            self::AKRILIK => 'Sedang',
            self::KUNINGAN => 'Tinggi',
            self::TEMBAGA => 'Sedang',
            self::STAINLESS_STEEL => 'Sangat Tinggi',
            self::ALUMINUM => 'Sedang',
        };
    }

    public function getCorrosionResistance(): string
    {
        return match($this) {
            self::AKRILIK => 'Baik',
            self::KUNINGAN => 'Baik',
            self::TEMBAGA => 'Sedang',
            self::STAINLESS_STEEL => 'Sangat Baik',
            self::ALUMINUM => 'Baik',
        };
    }

    public function getWorkability(): string
    {
        return match($this) {
            self::AKRILIK => 'Mudah',
            self::KUNINGAN => 'Sedang',
            self::TEMBAGA => 'Mudah',
            self::STAINLESS_STEEL => 'Sulit',
            self::ALUMINUM => 'Mudah',
        };
    }

    public function getEtchingSuitability(): string
    {
        return match($this) {
            self::AKRILIK => 'Sangat Baik',
            self::KUNINGAN => 'Baik',
            self::TEMBAGA => 'Baik',
            self::STAINLESS_STEEL => 'Sedang',
            self::ALUMINUM => 'Baik',
        };
    }

    public function getAvailableThicknesses(): array
    {
        return match($this) {
            self::AKRILIK => ['1mm', '2mm', '3mm', '5mm', '6mm'],
            self::KUNINGAN => ['1mm', '2mm', '3mm'],
            self::TEMBAGA => ['1mm', '2mm', '3mm'],
            self::STAINLESS_STEEL => ['1mm', '2mm', '3mm', '5mm'],
            self::ALUMINUM => ['1mm', '2mm', '3mm', '5mm'],
        };
    }

    public function getAvailableFinishes(): array
    {
        return match($this) {
            self::AKRILIK => ['glossy', 'matte', 'frosted'],
            self::KUNINGAN => ['polished', 'brushed', 'antique'],
            self::TEMBAGA => ['polished', 'brushed', 'oxidized'],
            self::STAINLESS_STEEL => ['brushed', 'mirror', 'satin'],
            self::ALUMINUM => ['natural', 'anodized', 'brushed'],
        };
    }

    public function calculateWeight(float $length, float $width, float $thickness): float
    {
        // Calculate volume in cm³ (convert mm to cm for thickness)
        $volume = $length * $width * ($thickness / 10);
        
        // Weight = density × volume
        return round($this->getDensity() * $volume, 1);
    }

    public static function fromString(string $value): self
    {
        return match($value) {
            'akrilik' => self::AKRILIK,
            'kuningan' => self::KUNINGAN,
            'tembaga' => self::TEMBAGA,
            'stainless_steel' => self::STAINLESS_STEEL,
            'aluminum' => self::ALUMINUM,
            default => throw new InvalidArgumentException("Invalid material: {$value}")
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

    public static function getMetalMaterials(): array
    {
        return array_filter(self::cases(), fn($case) => $case->isMetal());
    }

    public static function getPlasticMaterials(): array
    {
        return array_filter(self::cases(), fn($case) => $case->isPlastic());
    }

    public static function getEtchingSuitableMaterials(): array
    {
        return array_filter(self::cases(), function($case) {
            return in_array($case->getEtchingSuitability(), ['Baik', 'Sangat Baik']);
        });
    }

    public static function sortByPrice(array $materials): array
    {
        usort($materials, function($a, $b) {
            return $a->getPricingMultiplier() <=> $b->getPricingMultiplier();
        });
        return $materials;
    }

    public function isThicknessAvailable(string $thickness): bool
    {
        return in_array($thickness, $this->getAvailableThicknesses());
    }

    public function isFinishAvailable(string $finish): bool
    {
        return in_array($finish, $this->getAvailableFinishes());
    }

    public function getColor(): string
    {
        return match($this) {
            self::AKRILIK => '#FFFFFF',
            self::KUNINGAN => '#B5651D',
            self::TEMBAGA => '#B87333',
            self::STAINLESS_STEEL => '#C0C0C0',
            self::ALUMINUM => '#A8A8A8',
        };
    }

    // Legacy methods for compatibility
    public function getTypicalThickness(): array
    {
        return $this->getAvailableThicknesses();
    }

    public function isMetallic(): bool
    {
        return $this->isMetal();
    }

    public static function getAllMaterials(): array
    {
        return array_map(fn($case) => $case->value, self::cases());
    }

    public static function getMetallicMaterials(): array
    {
        return array_map(
            fn($case) => $case->value,
            array_filter(self::cases(), fn($case) => $case->isMetallic())
        );
    }

    public static function getNonMetallicMaterials(): array
    {
        return array_map(
            fn($case) => $case->value,
            array_filter(self::cases(), fn($case) => !$case->isMetallic())
        );
    }
}