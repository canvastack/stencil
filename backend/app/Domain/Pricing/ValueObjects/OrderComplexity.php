<?php

namespace App\Domain\Pricing\ValueObjects;

/**
 * Order Complexity Value Object
 * 
 * Represents the complexity level of an order for pricing calculations
 * Based on material type, design complexity, quantity, and special requirements
 */
class OrderComplexity
{
    private const COMPLEXITY_LEVELS = ['simple', 'medium', 'high', 'custom'];
    
    public function __construct(
        private string $level,
        private float $complexityScore = 0.0,
        private array $factors = []
    ) {
        $this->validateLevel($level);
        $this->complexityScore = $this->calculateComplexityScore();
    }
    
    /**
     * Create from order requirements
     */
    public static function fromOrderRequirements(array $requirements): self
    {
        $factors = [];
        $totalScore = 0;
        
        // Material complexity (1-3 points)
        $materialComplexity = self::calculateMaterialComplexity($requirements['material'] ?? 'steel');
        $factors['material'] = $materialComplexity;
        $totalScore += $materialComplexity;
        
        // Design complexity (1-4 points)
        $designComplexity = self::calculateDesignComplexity($requirements['design'] ?? []);
        $factors['design'] = $designComplexity;
        $totalScore += $designComplexity;
        
        // Quantity complexity (0-2 points)
        $quantityComplexity = self::calculateQuantityComplexity($requirements['quantity'] ?? 1);
        $factors['quantity'] = $quantityComplexity;
        $totalScore += $quantityComplexity;
        
        // Special requirements (0-3 points)
        $specialComplexity = self::calculateSpecialRequirements($requirements['special'] ?? []);
        $factors['special'] = $specialComplexity;
        $totalScore += $specialComplexity;
        
        // Timeline pressure (0-2 points)
        $timelineComplexity = self::calculateTimelineComplexity($requirements['timeline'] ?? null);
        $factors['timeline'] = $timelineComplexity;
        $totalScore += $timelineComplexity;
        
        $level = self::determineLevelFromScore($totalScore);
        
        return new self($level, $totalScore, $factors);
    }
    
    /**
     * Calculate material complexity
     */
    private static function calculateMaterialComplexity(string $material): float
    {
        return match(strtolower($material)) {
            'aluminum', 'steel' => 1.0,
            'stainless_steel', 'brass' => 2.0,
            'titanium', 'copper' => 2.5,
            'glass', 'acrylic' => 3.0,
            default => 1.5
        };
    }
    
    /**
     * Calculate design complexity
     */
    private static function calculateDesignComplexity(array $design): float
    {
        $score = 1.0; // Base score
        
        // Text complexity
        if (isset($design['text_lines']) && $design['text_lines'] > 3) {
            $score += 0.5;
        }
        
        // Logo/graphics complexity
        if (isset($design['has_logo']) && $design['has_logo']) {
            $score += 1.0;
        }
        
        if (isset($design['has_graphics']) && $design['has_graphics']) {
            $score += 1.5;
        }
        
        // Color requirements
        if (isset($design['colors']) && count($design['colors']) > 1) {
            $score += 0.5;
        }
        
        // Special finishes
        if (isset($design['finish']) && in_array($design['finish'], ['brushed', 'polished', 'anodized'])) {
            $score += 1.0;
        }
        
        return min($score, 4.0);
    }
    
    /**
     * Calculate quantity complexity
     */
    private static function calculateQuantityComplexity(int $quantity): float
    {
        if ($quantity === 1) {
            return 2.0; // Single items are more complex to setup
        } elseif ($quantity <= 10) {
            return 1.5;
        } elseif ($quantity <= 50) {
            return 1.0;
        } elseif ($quantity <= 100) {
            return 0.5;
        } else {
            return 0.0; // Bulk orders are simpler per unit
        }
    }
    
    /**
     * Calculate special requirements complexity
     */
    private static function calculateSpecialRequirements(array $special): float
    {
        $score = 0.0;
        
        if (in_array('custom_packaging', $special)) {
            $score += 0.5;
        }
        
        if (in_array('rush_delivery', $special)) {
            $score += 1.0;
        }
        
        if (in_array('quality_certification', $special)) {
            $score += 1.0;
        }
        
        if (in_array('custom_tooling', $special)) {
            $score += 2.0;
        }
        
        if (in_array('prototype_required', $special)) {
            $score += 1.5;
        }
        
        return min($score, 3.0);
    }
    
    /**
     * Calculate timeline complexity
     */
    private static function calculateTimelineComplexity(?array $timeline): float
    {
        if (!$timeline || !isset($timeline['required_days'])) {
            return 0.0;
        }
        
        $requiredDays = $timeline['required_days'];
        
        if ($requiredDays <= 7) {
            return 2.0; // Rush job
        } elseif ($requiredDays <= 14) {
            return 1.0; // Tight timeline
        } elseif ($requiredDays <= 21) {
            return 0.5; // Standard timeline
        } else {
            return 0.0; // Flexible timeline
        }
    }
    
    /**
     * Determine complexity level from total score
     */
    private static function determineLevelFromScore(float $score): string
    {
        return match(true) {
            $score <= 3.0 => 'simple',
            $score <= 6.0 => 'medium',
            $score <= 9.0 => 'high',
            default => 'custom'
        };
    }
    
    /**
     * Calculate overall complexity score
     */
    private function calculateComplexityScore(): float
    {
        if (!empty($this->factors)) {
            return array_sum($this->factors);
        }
        
        // Fallback scoring based on level
        return match($this->level) {
            'simple' => 2.0,
            'medium' => 5.0,
            'high' => 8.0,
            'custom' => 10.0,
            default => 5.0
        };
    }
    
    /**
     * Validate complexity level
     */
    private function validateLevel(string $level): void
    {
        if (!in_array($level, self::COMPLEXITY_LEVELS)) {
            throw new \InvalidArgumentException(
                "Invalid complexity level: {$level}. Must be one of: " . implode(', ', self::COMPLEXITY_LEVELS)
            );
        }
    }
    
    // Getters
    public function getLevel(): string
    {
        return $this->level;
    }
    
    public function getComplexityScore(): float
    {
        return $this->complexityScore;
    }
    
    public function getFactors(): array
    {
        return $this->factors;
    }
    
    /**
     * Check if complexity is high
     */
    public function isHighComplexity(): bool
    {
        return in_array($this->level, ['high', 'custom']);
    }
    
    /**
     * Check if requires special handling
     */
    public function requiresSpecialHandling(): bool
    {
        return $this->level === 'custom' || $this->complexityScore >= 9.0;
    }
    
    /**
     * Get complexity description
     */
    public function getDescription(): string
    {
        return match($this->level) {
            'simple' => 'Simple order with standard materials and basic design',
            'medium' => 'Moderate complexity with some custom requirements',
            'high' => 'High complexity requiring specialized skills and materials',
            'custom' => 'Custom order requiring unique tooling and extensive customization',
            default => 'Standard complexity order'
        };
    }
    
    /**
     * Get recommended timeline multiplier
     */
    public function getTimelineMultiplier(): float
    {
        return match($this->level) {
            'simple' => 1.0,
            'medium' => 1.2,
            'high' => 1.5,
            'custom' => 2.0,
            default => 1.0
        };
    }
    
    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'level' => $this->level,
            'complexity_score' => $this->complexityScore,
            'factors' => $this->factors,
            'description' => $this->getDescription(),
            'timeline_multiplier' => $this->getTimelineMultiplier(),
            'requires_special_handling' => $this->requiresSpecialHandling(),
            'is_high_complexity' => $this->isHighComplexity()
        ];
    }
}