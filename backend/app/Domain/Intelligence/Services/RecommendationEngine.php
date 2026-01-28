<?php

namespace App\Domain\Intelligence\Services;

use App\Domain\Intelligence\ValueObjects\OrderRecommendations;
use App\Domain\Intelligence\ValueObjects\ProductRecommendation;
use App\Domain\Intelligence\ValueObjects\VendorRecommendation;
use App\Domain\Intelligence\ValueObjects\PricingRecommendation;
use App\Domain\Intelligence\ValueObjects\OrderSuccessPrediction;
use App\Domain\Intelligence\Services\MachineLearningService;
use App\Domain\Intelligence\Services\DataAnalysisService;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Order\Entities\PurchaseOrder;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Product\Repositories\ProductRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Shared\ValueObjects\Money;
use Carbon\Carbon;

/**
 * AI-Powered Recommendation Engine
 * 
 * Provides intelligent recommendations for orders, products, vendors, and pricing
 * based on machine learning analysis of historical data from the database.
 * 
 * Integrates with existing database tables:
 * - orders table for order history and patterns
 * - customers table for customer behavior analysis
 * - vendors table for vendor performance analysis
 * - products table for product preferences
 */
class RecommendationEngine
{
    public function __construct(
        private MachineLearningService $mlService,
        private DataAnalysisService $dataAnalysisService,
        private OrderRepositoryInterface $orderRepository,
        private ProductRepositoryInterface $productRepository,
        private VendorRepositoryInterface $vendorRepository
    ) {}

    /**
     * Generate comprehensive order recommendations for a customer
     */
    public function generateOrderRecommendations(Customer $customer): OrderRecommendations
    {
        // Analyze customer history from orders table where customer_id = customer.id
        $customerHistory = $this->analyzeCustomerHistory($customer);
        
        // Identify patterns using customers.metadata and orders.items JSON fields
        $patterns = $this->mlService->identifyPatterns($customerHistory);
        
        // Generate product recommendations based on orders.items analysis
        $productRecommendations = $this->generateProductRecommendations($patterns, $customer);
        
        // Generate vendor recommendations based on orders.vendor_id patterns
        $vendorRecommendations = $this->generateVendorRecommendations($customer, $patterns);
        
        // Generate pricing recommendations based on orders.total_amount patterns
        $pricingRecommendations = $this->generatePricingRecommendations($customer, $patterns);
        
        return new OrderRecommendations(
            customerId: $customer->getId(), // customers.id (BIGINT)
            productRecommendations: $productRecommendations,
            vendorRecommendations: $vendorRecommendations,
            pricingRecommendations: $pricingRecommendations,
            confidenceScore: $this->calculateConfidenceScore($patterns),
            reasoning: $this->generateRecommendationReasoning($patterns),
            generatedAt: now()
        );
    }

    /**
     * Predict order success probability using ML models
     */
    public function predictOrderSuccess(PurchaseOrder $order): OrderSuccessPrediction
    {
        $features = $this->extractOrderFeatures($order);
        $prediction = $this->mlService->predict('order_success', $features);
        
        return new OrderSuccessPrediction(
            orderId: $order->getId(), // orders.id (BIGINT)
            successProbability: $prediction['probability'],
            riskFactors: $this->identifyRiskFactors($features, $prediction),
            recommendations: $this->generateSuccessRecommendations($prediction),
            confidenceLevel: $prediction['confidence'],
            modelVersion: $prediction['model_version'] ?? '1.0'
        );
    }

    /**
     * Analyze customer history from orders table
     */
    private function analyzeCustomerHistory(Customer $customer): array
    {
        // Get customer orders from orders table filtered by customer_id
        $orders = $this->orderRepository->findByCustomer($customer->getId());
        
        $history = [
            'total_orders' => count($orders),
            'total_value' => 0,
            'average_order_value' => 0,
            'order_frequency' => 0,
            'preferred_materials' => [],
            'preferred_vendors' => [],
            'seasonal_patterns' => [],
            'complexity_preferences' => [],
            'payment_patterns' => [],
            'delivery_preferences' => []
        ];
        
        if (empty($orders)) {
            return $history;
        }
        
        // Calculate total value from orders.total_amount
        $totalValue = array_reduce($orders, fn($sum, $order) => $sum + $order->getTotalAmount()->getAmount(), 0);
        $history['total_value'] = $totalValue;
        $history['average_order_value'] = $totalValue / count($orders);
        
        // Calculate order frequency
        $firstOrder = min(array_map(fn($order) => $order->getCreatedAt(), $orders));
        $lastOrder = max(array_map(fn($order) => $order->getCreatedAt(), $orders));
        $daysBetween = $firstOrder->diffInDays($lastOrder);
        $history['order_frequency'] = $daysBetween > 0 ? count($orders) / $daysBetween * 30 : 0; // Orders per month
        
        // Analyze material preferences from orders.items JSON
        $materialCounts = [];
        foreach ($orders as $order) {
            $items = $order->getItems();
            foreach ($items as $item) {
                $material = $item['specifications']['material'] ?? 'unknown';
                $materialCounts[$material] = ($materialCounts[$material] ?? 0) + 1;
            }
        }
        arsort($materialCounts);
        $history['preferred_materials'] = array_keys(array_slice($materialCounts, 0, 3));
        
        // Analyze vendor preferences from orders.vendor_id
        $vendorCounts = [];
        foreach ($orders as $order) {
            if ($order->getVendorId()) {
                $vendorId = $order->getVendorId()->getValue();
                $vendorCounts[$vendorId] = ($vendorCounts[$vendorId] ?? 0) + 1;
            }
        }
        arsort($vendorCounts);
        $history['preferred_vendors'] = array_keys(array_slice($vendorCounts, 0, 3));
        
        // Analyze seasonal patterns from orders.created_at
        $seasonalCounts = [];
        foreach ($orders as $order) {
            $month = $order->getCreatedAt()->format('n'); // 1-12
            $season = $this->getSeasonFromMonth($month);
            $seasonalCounts[$season] = ($seasonalCounts[$season] ?? 0) + 1;
        }
        $history['seasonal_patterns'] = $seasonalCounts;
        
        // Analyze complexity preferences from orders metadata
        $complexityCounts = [];
        foreach ($orders as $order) {
            $metadata = $order->getMetadata();
            $complexity = $metadata['complexity'] ?? 'medium';
            $complexityCounts[$complexity] = ($complexityCounts[$complexity] ?? 0) + 1;
        }
        $history['complexity_preferences'] = $complexityCounts;
        
        return $history;
    }

    /**
     * Generate product recommendations based on patterns
     */
    private function generateProductRecommendations(array $patterns, Customer $customer): array
    {
        $recommendations = [];
        
        // Get customer's tenant products
        $products = $this->productRepository->findByTenant($customer->getTenantId());
        
        // Analyze seasonal patterns from orders.created_at and orders.items JSON
        $currentSeason = $this->getCurrentSeason();
        $seasonalProducts = $this->analyzeSeasonalPreferences($patterns, $currentSeason);
        
        // Analyze material preferences from orders.items and products.metadata
        $materialPreferences = $this->analyzeMaterialPreferences($patterns);
        
        // Analyze complexity preferences from orders.production_type
        $complexityPreferences = $this->analyzeComplexityPreferences($patterns);
        
        foreach ($products as $product) {
            $score = $this->calculateProductRecommendationScore($product, $patterns, $customer);
            
            if ($score > 0.6) { // Only recommend products with >60% confidence
                $recommendations[] = new ProductRecommendation(
                    productId: $product->getId(), // products.id reference
                    productName: $product->getName(),
                    reason: $this->generateProductRecommendationReason($product, $patterns),
                    confidence: $score,
                    expectedOrderValue: $this->predictOrderValue($product, $patterns), // Based on products.price
                    seasonalRelevance: $this->calculateSeasonalRelevance($product, $currentSeason),
                    materialMatch: in_array($product->getMaterial(), $materialPreferences),
                    complexityMatch: $this->checkComplexityMatch($product, $complexityPreferences)
                );
            }
        }
        
        // Sort by confidence score
        usort($recommendations, fn($a, $b) => $b->getConfidence() <=> $a->getConfidence());
        
        return array_slice($recommendations, 0, 10); // Top 10 recommendations
    }

    /**
     * Generate vendor recommendations based on customer patterns
     */
    private function generateVendorRecommendations(Customer $customer, array $patterns): array
    {
        $recommendations = [];
        
        // Get available vendors for customer's tenant
        $vendors = $this->vendorRepository->findByTenant($customer->getTenantId());
        
        foreach ($vendors as $vendor) {
            $score = $this->calculateVendorRecommendationScore($vendor, $patterns, $customer);
            
            if ($score > 0.5) { // Only recommend vendors with >50% confidence
                $recommendations[] = new VendorRecommendation(
                    vendorId: $vendor->getId(), // vendors.id reference
                    vendorName: $vendor->getName(),
                    reason: $this->generateVendorRecommendationReason($vendor, $patterns),
                    confidence: $score,
                    expectedLeadTime: $vendor->getLeadTime(), // vendors.lead_time
                    qualityScore: $vendor->getRating(), // vendors.rating
                    priceCompetitiveness: $this->calculatePriceCompetitiveness($vendor, $patterns),
                    pastCollaboration: $this->checkPastCollaboration($vendor, $customer),
                    capacityAvailability: $this->checkVendorCapacity($vendor)
                );
            }
        }
        
        // Sort by confidence score
        usort($recommendations, fn($a, $b) => $b->getConfidence() <=> $a->getConfidence());
        
        return array_slice($recommendations, 0, 5); // Top 5 vendor recommendations
    }

    /**
     * Generate pricing recommendations based on customer patterns
     */
    private function generatePricingRecommendations(Customer $customer, array $patterns): array
    {
        $recommendations = [];
        
        // Analyze customer's price sensitivity from orders.total_amount patterns
        $priceSensitivity = $this->analyzePriceSensitivity($patterns);
        
        // Get customer's average order value
        $averageOrderValue = $patterns['average_order_value'] ?? 0;
        
        // Generate pricing strategy recommendations
        if ($priceSensitivity < 0.3) { // Low price sensitivity
            $recommendations[] = new PricingRecommendation(
                strategy: 'premium_pricing',
                reason: 'Customer shows low price sensitivity and values quality',
                suggestedMarkup: 0.45, // 45% markup
                confidence: 0.8,
                expectedImpact: 'Higher profit margins with maintained conversion',
                riskLevel: 'low'
            );
        } elseif ($priceSensitivity > 0.7) { // High price sensitivity
            $recommendations[] = new PricingRecommendation(
                strategy: 'competitive_pricing',
                reason: 'Customer is highly price-sensitive, focus on competitive rates',
                suggestedMarkup: 0.25, // 25% markup
                confidence: 0.75,
                expectedImpact: 'Higher conversion rate with lower margins',
                riskLevel: 'medium'
            );
        } else { // Medium price sensitivity
            $recommendations[] = new PricingRecommendation(
                strategy: 'value_based_pricing',
                reason: 'Customer balances price and quality considerations',
                suggestedMarkup: 0.35, // 35% markup
                confidence: 0.85,
                expectedImpact: 'Balanced approach optimizing both conversion and margins',
                riskLevel: 'low'
            );
        }
        
        // Volume-based pricing recommendations
        if ($patterns['total_orders'] > 10) {
            $recommendations[] = new PricingRecommendation(
                strategy: 'volume_discount',
                reason: 'Customer has high order frequency, offer volume incentives',
                suggestedMarkup: 0.30, // 30% markup with volume discount
                confidence: 0.9,
                expectedImpact: 'Increased customer loyalty and larger order sizes',
                riskLevel: 'low'
            );
        }
        
        return $recommendations;
    }

    /**
     * Extract features from order for ML prediction
     */
    private function extractOrderFeatures(PurchaseOrder $order): array
    {
        $customer = $order->getCustomer();
        $vendor = $order->getVendor();
        
        return [
            // Order features
            'order_value' => $order->getTotalAmount()->getAmount(),
            'item_count' => count($order->getItems()),
            'complexity_score' => $this->calculateComplexityScore($order),
            'delivery_urgency' => $this->calculateDeliveryUrgency($order),
            
            // Customer features
            'customer_order_history' => $customer ? $this->getCustomerOrderCount($customer) : 0,
            'customer_success_rate' => $customer ? $this->getCustomerSuccessRate($customer) : 0.5,
            'customer_payment_reliability' => $customer ? $this->getCustomerPaymentReliability($customer) : 0.5,
            
            // Vendor features
            'vendor_rating' => $vendor ? $vendor->getRating() : 3.0,
            'vendor_lead_time' => $vendor ? $vendor->getLeadTime() : 14,
            'vendor_capacity_utilization' => $vendor ? $this->getVendorCapacityUtilization($vendor) : 0.5,
            
            // Market features
            'seasonal_factor' => $this->getSeasonalFactor($order->getCreatedAt()),
            'market_demand' => $this->getCurrentMarketDemand(),
            'material_availability' => $this->getMaterialAvailability($order)
        ];
    }

    /**
     * Calculate confidence score for recommendations
     */
    private function calculateConfidenceScore(array $patterns): float
    {
        $factors = [
            'data_quality' => $this->assessDataQuality($patterns),
            'pattern_strength' => $this->assessPatternStrength($patterns),
            'sample_size' => $this->assessSampleSize($patterns),
            'recency' => $this->assessDataRecency($patterns)
        ];
        
        // Weighted average of confidence factors
        $weights = [
            'data_quality' => 0.3,
            'pattern_strength' => 0.3,
            'sample_size' => 0.2,
            'recency' => 0.2
        ];
        
        $confidence = 0;
        foreach ($factors as $factor => $score) {
            $confidence += $score * $weights[$factor];
        }
        
        return min(1.0, max(0.0, $confidence));
    }

    /**
     * Generate human-readable reasoning for recommendations
     */
    private function generateRecommendationReasoning(array $patterns): array
    {
        $reasoning = [];
        
        if ($patterns['total_orders'] > 5) {
            $reasoning[] = "Based on {$patterns['total_orders']} previous orders, we identified strong purchasing patterns";
        }
        
        if (!empty($patterns['preferred_materials'])) {
            $materials = implode(', ', array_slice($patterns['preferred_materials'], 0, 2));
            $reasoning[] = "Customer shows preference for {$materials} materials";
        }
        
        if ($patterns['order_frequency'] > 1) {
            $reasoning[] = "Regular ordering pattern detected (avg {$patterns['order_frequency']} orders per month)";
        }
        
        if (!empty($patterns['seasonal_patterns'])) {
            $topSeason = array_key_first($patterns['seasonal_patterns']);
            $reasoning[] = "Seasonal preference identified for {$topSeason} orders";
        }
        
        return $reasoning;
    }

    // Helper methods for calculations and analysis

    private function getSeasonFromMonth(int $month): string
    {
        return match(true) {
            in_array($month, [12, 1, 2]) => 'winter',
            in_array($month, [3, 4, 5]) => 'spring',
            in_array($month, [6, 7, 8]) => 'summer',
            in_array($month, [9, 10, 11]) => 'autumn',
            default => 'unknown'
        };
    }

    private function getCurrentSeason(): string
    {
        return $this->getSeasonFromMonth((int) date('n'));
    }

    private function analyzeSeasonalPreferences(array $patterns, string $currentSeason): array
    {
        return $patterns['seasonal_patterns'][$currentSeason] ?? [];
    }

    private function analyzeMaterialPreferences(array $patterns): array
    {
        return $patterns['preferred_materials'] ?? [];
    }

    private function analyzeComplexityPreferences(array $patterns): array
    {
        return $patterns['complexity_preferences'] ?? [];
    }

    private function calculateProductRecommendationScore($product, array $patterns, Customer $customer): float
    {
        $score = 0.5; // Base score
        
        // Material preference match
        if (in_array($product->getMaterial(), $patterns['preferred_materials'] ?? [])) {
            $score += 0.2;
        }
        
        // Price range compatibility
        $avgOrderValue = $patterns['average_order_value'] ?? 0;
        if ($avgOrderValue > 0) {
            $priceRatio = $product->getPrice()->getAmount() / $avgOrderValue;
            if ($priceRatio >= 0.8 && $priceRatio <= 1.2) { // Within 20% of average
                $score += 0.15;
            }
        }
        
        // Seasonal relevance
        $currentSeason = $this->getCurrentSeason();
        if ($this->isProductSeasonallyRelevant($product, $currentSeason)) {
            $score += 0.1;
        }
        
        // Product popularity (based on overall orders)
        $popularityScore = $this->getProductPopularityScore($product);
        $score += $popularityScore * 0.15;
        
        return min(1.0, $score);
    }

    private function calculateVendorRecommendationScore($vendor, array $patterns, Customer $customer): float
    {
        $score = 0.3; // Base score
        
        // Past collaboration
        if (in_array($vendor->getId()->getValue(), $patterns['preferred_vendors'] ?? [])) {
            $score += 0.3;
        }
        
        // Quality rating
        $score += ($vendor->getRating() / 5.0) * 0.2;
        
        // Lead time compatibility
        $avgLeadTime = $this->getAverageLeadTimePreference($patterns);
        if ($avgLeadTime > 0) {
            $leadTimeRatio = $vendor->getLeadTime() / $avgLeadTime;
            if ($leadTimeRatio <= 1.1) { // Within 10% of preferred lead time
                $score += 0.15;
            }
        }
        
        // Capacity availability
        if ($this->checkVendorCapacity($vendor) > 0.7) {
            $score += 0.05;
        }
        
        return min(1.0, $score);
    }

    private function predictOrderValue($product, array $patterns): Money
    {
        $basePrice = $product->getPrice()->getAmount();
        $avgOrderValue = $patterns['average_order_value'] ?? $basePrice;
        
        // Adjust based on customer patterns
        $adjustmentFactor = 1.0;
        
        if ($avgOrderValue > $basePrice * 2) {
            $adjustmentFactor = 1.5; // Customer tends to order larger quantities
        } elseif ($avgOrderValue < $basePrice * 0.5) {
            $adjustmentFactor = 0.8; // Customer tends to order smaller quantities
        }
        
        $predictedValue = (int) ($basePrice * $adjustmentFactor);
        
        return new Money($predictedValue, $product->getPrice()->getCurrency());
    }

    // Additional helper methods would be implemented here...
    // For brevity, providing placeholder implementations

    private function generateProductRecommendationReason($product, array $patterns): string
    {
        return "Recommended based on your material preferences and order history";
    }

    private function generateVendorRecommendationReason($vendor, array $patterns): string
    {
        return "High-quality vendor with good lead times and past collaboration";
    }

    private function calculateSeasonalRelevance($product, string $season): float
    {
        // Placeholder implementation
        return 0.8;
    }

    private function checkComplexityMatch($product, array $complexityPreferences): bool
    {
        // Placeholder implementation
        return true;
    }

    private function analyzePriceSensitivity(array $patterns): float
    {
        // Placeholder implementation - analyze price variance in customer orders
        return 0.5;
    }

    private function calculateComplexityScore(PurchaseOrder $order): float
    {
        // Placeholder implementation
        return 0.5;
    }

    private function calculateDeliveryUrgency(PurchaseOrder $order): float
    {
        // Placeholder implementation
        return 0.5;
    }

    private function getCustomerOrderCount(Customer $customer): int
    {
        return $this->orderRepository->countByCustomer($customer->getId());
    }

    private function getCustomerSuccessRate(Customer $customer): float
    {
        // Placeholder implementation
        return 0.85;
    }

    private function getCustomerPaymentReliability(Customer $customer): float
    {
        // Placeholder implementation
        return 0.9;
    }

    private function getVendorCapacityUtilization($vendor): float
    {
        // Placeholder implementation
        return 0.7;
    }

    private function getSeasonalFactor(\DateTime $date): float
    {
        // Placeholder implementation
        return 1.0;
    }

    private function getCurrentMarketDemand(): float
    {
        // Placeholder implementation
        return 0.8;
    }

    private function getMaterialAvailability(PurchaseOrder $order): float
    {
        // Placeholder implementation
        return 0.9;
    }

    private function assessDataQuality(array $patterns): float
    {
        return min(1.0, ($patterns['total_orders'] ?? 0) / 10);
    }

    private function assessPatternStrength(array $patterns): float
    {
        return 0.8; // Placeholder
    }

    private function assessSampleSize(array $patterns): float
    {
        return min(1.0, ($patterns['total_orders'] ?? 0) / 20);
    }

    private function assessDataRecency(array $patterns): float
    {
        return 0.9; // Placeholder
    }

    private function isProductSeasonallyRelevant($product, string $season): bool
    {
        return true; // Placeholder
    }

    private function getProductPopularityScore($product): float
    {
        return 0.5; // Placeholder
    }

    private function getAverageLeadTimePreference(array $patterns): int
    {
        return 14; // Placeholder
    }

    private function checkVendorCapacity($vendor): float
    {
        return 0.8; // Placeholder
    }

    private function calculatePriceCompetitiveness($vendor, array $patterns): float
    {
        return 0.7; // Placeholder
    }

    private function checkPastCollaboration($vendor, Customer $customer): bool
    {
        return false; // Placeholder
    }

    private function identifyRiskFactors(array $features, array $prediction): array
    {
        return []; // Placeholder
    }

    private function generateSuccessRecommendations(array $prediction): array
    {
        return []; // Placeholder
    }
}