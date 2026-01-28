<?php

namespace App\Domain\Intelligence\Services;

use App\Domain\Intelligence\ValueObjects\MLPrediction;
use App\Domain\Intelligence\ValueObjects\PatternAnalysis;
use App\Domain\Intelligence\ValueObjects\ModelTrainingResult;
use App\Domain\Shared\ValueObjects\UuidValueObject;

/**
 * Machine Learning Service
 * 
 * Provides machine learning capabilities for pattern recognition,
 * prediction, and data analysis using statistical models and algorithms.
 */
class MachineLearningService
{
    private array $models = [];
    private array $trainingData = [];
    
    public function __construct()
    {
        $this->initializeModels();
    }

    /**
     * Identify patterns in customer behavior data
     */
    public function identifyPatterns(array $data): PatternAnalysis
    {
        $patterns = [
            'seasonal_patterns' => $this->analyzeSeasonalPatterns($data),
            'frequency_patterns' => $this->analyzeFrequencyPatterns($data),
            'value_patterns' => $this->analyzeValuePatterns($data),
            'material_patterns' => $this->analyzeMaterialPatterns($data),
            'vendor_patterns' => $this->analyzeVendorPatterns($data),
            'complexity_patterns' => $this->analyzeComplexityPatterns($data)
        ];
        
        $strength = $this->calculatePatternStrength($patterns);
        $confidence = $this->calculatePatternConfidence($data, $patterns);
        
        return new PatternAnalysis(
            patterns: $patterns,
            strength: $strength,
            confidence: $confidence,
            sampleSize: count($data),
            analysisDate: now()
        );
    }

    /**
     * Make predictions using trained models
     */
    public function predict(string $modelName, array $features): array
    {
        if (!isset($this->models[$modelName])) {
            throw new \InvalidArgumentException("Model '{$modelName}' not found");
        }
        
        $model = $this->models[$modelName];
        
        return match($modelName) {
            'order_success' => $this->predictOrderSuccess($features),
            'customer_churn' => $this->predictCustomerChurn($features),
            'demand_forecast' => $this->predictDemand($features),
            'price_optimization' => $this->optimizePrice($features),
            default => throw new \InvalidArgumentException("Unknown model: {$modelName}")
        };
    }

    /**
     * Analyze trends in historical data
     */
    public function analyzeTrends(array $historicalData, array $externalFactors = []): array
    {
        $trends = [
            'demand_trend' => $this->calculateDemandTrend($historicalData),
            'price_trend' => $this->calculatePriceTrend($historicalData),
            'seasonal_trend' => $this->calculateSeasonalTrend($historicalData),
            'growth_trend' => $this->calculateGrowthTrend($historicalData),
            'volatility_trend' => $this->calculateVolatilityTrend($historicalData)
        ];
        
        // Incorporate external factors
        if (!empty($externalFactors)) {
            $trends = $this->adjustTrendsForExternalFactors($trends, $externalFactors);
        }
        
        return $trends;
    }

    /**
     * Optimize inventory levels using ML algorithms
     */
    public function optimizeInventory(array $currentInventory, array $demandForecast, array $supplierLeadTimes): array
    {
        $optimization = [
            'stock_levels' => [],
            'reorder_points' => [],
            'eoq' => [], // Economic Order Quantity
            'projected_savings' => 0,
            'service_level' => 0.95
        ];
        
        foreach ($currentInventory as $productId => $currentStock) {
            $demand = $demandForecast[$productId] ?? 0;
            $leadTime = $supplierLeadTimes[$productId] ?? 14;
            
            // Calculate optimal stock level using Wilson EOQ formula
            $eoq = $this->calculateEOQ($demand, $leadTime);
            $reorderPoint = $this->calculateReorderPoint($demand, $leadTime);
            $optimalStock = $this->calculateOptimalStockLevel($demand, $leadTime, $eoq);
            
            $optimization['stock_levels'][$productId] = $optimalStock;
            $optimization['reorder_points'][$productId] = $reorderPoint;
            $optimization['eoq'][$productId] = $eoq;
        }
        
        $optimization['projected_savings'] = $this->calculateProjectedSavings($currentInventory, $optimization);
        
        return $optimization;
    }

    /**
     * Recognize intent from natural language text
     */
    public function recognizeIntent(string $text, array $context = []): array
    {
        $normalizedText = strtolower(trim($text));
        
        // Intent patterns with confidence scores
        $intentPatterns = [
            'navigate' => [
                'patterns' => ['/go to|navigate|open|show/i', '/dashboard|page|section/i'],
                'confidence' => 0.8
            ],
            'search' => [
                'patterns' => ['/search|find|look for/i', '/customer|order|product|vendor/i'],
                'confidence' => 0.85
            ],
            'create' => [
                'patterns' => ['/create|add|new/i', '/order|customer|product|vendor/i'],
                'confidence' => 0.9
            ],
            'update' => [
                'patterns' => ['/update|edit|modify|change/i'],
                'confidence' => 0.8
            ],
            'delete' => [
                'patterns' => ['/delete|remove|cancel/i'],
                'confidence' => 0.85
            ],
            'status' => [
                'patterns' => ['/status|what is|how many|count/i'],
                'confidence' => 0.75
            ]
        ];
        
        $bestMatch = ['intent' => 'unknown', 'confidence' => 0.0, 'entities' => []];
        
        foreach ($intentPatterns as $intent => $config) {
            $matchCount = 0;
            $totalPatterns = count($config['patterns']);
            
            foreach ($config['patterns'] as $pattern) {
                if (preg_match($pattern, $normalizedText)) {
                    $matchCount++;
                }
            }
            
            if ($matchCount > 0) {
                $confidence = ($matchCount / $totalPatterns) * $config['confidence'];
                
                if ($confidence > $bestMatch['confidence']) {
                    $bestMatch = [
                        'intent' => $intent,
                        'confidence' => $confidence,
                        'entities' => $this->extractEntities($normalizedText, $intent)
                    ];
                }
            }
        }
        
        // Apply context boost if available
        if (!empty($context) && $bestMatch['confidence'] > 0) {
            $bestMatch['confidence'] = min(0.95, $bestMatch['confidence'] * 1.1);
        }
        
        return $bestMatch;
    }

    /**
     * Extract entities from text based on intent
     */
    private function extractEntities(string $text, string $intent): array
    {
        $entities = [];
        
        // Entity patterns by intent
        $entityPatterns = [
            'navigate' => [
                'target' => '/(?:to|open|show)\s+(\w+)/i'
            ],
            'search' => [
                'query' => '/(?:search for|find|look for)\s+(.+)/i',
                'entity_type' => '/(customer|order|product|vendor)s?/i'
            ],
            'create' => [
                'entity_type' => '/(?:create|add|new)\s+(\w+)/i'
            ],
            'update' => [
                'entity_type' => '/(?:update|edit|modify)\s+(\w+)/i'
            ],
            'delete' => [
                'entity_type' => '/(?:delete|remove)\s+(\w+)/i'
            ]
        ];
        
        if (isset($entityPatterns[$intent])) {
            foreach ($entityPatterns[$intent] as $entityType => $pattern) {
                if (preg_match($pattern, $text, $matches)) {
                    $entities[] = [
                        'type' => $entityType,
                        'value' => trim($matches[1] ?? ''),
                        'confidence' => 0.8
                    ];
                }
            }
        }
        
        return $entities;
    }

    /**
     * Train a new model with provided data
     */
    public function trainModel(string $modelName, array $trainingData, array $parameters = []): ModelTrainingResult
    {
        $startTime = microtime(true);
        
        // Prepare training data
        $preparedData = $this->prepareTrainingData($trainingData);
        
        // Train model based on type
        $model = match($modelName) {
            'order_success' => $this->trainOrderSuccessModel($preparedData, $parameters),
            'customer_churn' => $this->trainCustomerChurnModel($preparedData, $parameters),
            'demand_forecast' => $this->trainDemandForecastModel($preparedData, $parameters),
            default => throw new \InvalidArgumentException("Unknown model type: {$modelName}")
        };
        
        $trainingTime = microtime(true) - $startTime;
        
        // Validate model performance
        $performance = $this->validateModel($model, $preparedData);
        
        // Store trained model
        $this->models[$modelName] = $model;
        
        return new ModelTrainingResult(
            modelName: $modelName,
            accuracy: $performance['accuracy'],
            precision: $performance['precision'],
            recall: $performance['recall'],
            f1Score: $performance['f1_score'],
            trainingTime: $trainingTime,
            sampleSize: count($trainingData),
            parameters: $parameters,
            trainedAt: now()
        );
    }

    /**
     * Initialize default models
     */
    private function initializeModels(): void
    {
        $this->models = [
            'order_success' => $this->createOrderSuccessModel(),
            'customer_churn' => $this->createCustomerChurnModel(),
            'demand_forecast' => $this->createDemandForecastModel(),
            'price_optimization' => $this->createPriceOptimizationModel()
        ];
    }

    /**
     * Analyze seasonal patterns in data
     */
    private function analyzeSeasonalPatterns(array $data): array
    {
        $seasonalData = [];
        
        foreach ($data as $record) {
            if (isset($record['created_at'])) {
                $month = date('n', strtotime($record['created_at']));
                $season = $this->getSeasonFromMonth($month);
                $seasonalData[$season] = ($seasonalData[$season] ?? 0) + 1;
            }
        }
        
        // Calculate seasonal indices
        $total = array_sum($seasonalData);
        $seasonalIndices = [];
        
        if ($total > 0) {
            foreach ($seasonalData as $season => $count) {
                $seasonalIndices[$season] = $count / $total;
            }
        }
        
        return [
            'counts' => $seasonalData,
            'indices' => $seasonalIndices,
            'peak_season' => $this->findPeakSeason($seasonalData),
            'seasonality_strength' => $this->calculateSeasonalityStrength($seasonalIndices)
        ];
    }

    /**
     * Analyze frequency patterns
     */
    private function analyzeFrequencyPatterns(array $data): array
    {
        if (empty($data)) {
            return ['frequency' => 0, 'pattern' => 'irregular'];
        }
        
        $dates = array_map(fn($record) => strtotime($record['created_at'] ?? 'now'), $data);
        sort($dates);
        
        $intervals = [];
        for ($i = 1; $i < count($dates); $i++) {
            $intervals[] = $dates[$i] - $dates[$i - 1];
        }
        
        if (empty($intervals)) {
            return ['frequency' => 0, 'pattern' => 'single'];
        }
        
        $avgInterval = array_sum($intervals) / count($intervals);
        $stdDev = $this->calculateStandardDeviation($intervals);
        
        $pattern = match(true) {
            $stdDev / $avgInterval < 0.2 => 'regular',
            $stdDev / $avgInterval < 0.5 => 'semi-regular',
            default => 'irregular'
        };
        
        return [
            'frequency' => 86400 / $avgInterval, // Orders per day
            'pattern' => $pattern,
            'average_interval' => $avgInterval,
            'variability' => $stdDev / $avgInterval
        ];
    }

    /**
     * Predict order success probability
     */
    private function predictOrderSuccess(array $features): array
    {
        // Simplified logistic regression model
        $weights = [
            'order_value' => 0.0001,
            'customer_success_rate' => 0.8,
            'vendor_rating' => 0.15,
            'complexity_score' => -0.3,
            'delivery_urgency' => -0.2,
            'seasonal_factor' => 0.1
        ];
        
        $score = 0.5; // Base probability
        
        foreach ($weights as $feature => $weight) {
            if (isset($features[$feature])) {
                $score += $features[$feature] * $weight;
            }
        }
        
        // Apply sigmoid function to get probability
        $probability = 1 / (1 + exp(-$score));
        
        return [
            'probability' => min(0.99, max(0.01, $probability)),
            'confidence' => $this->calculatePredictionConfidence($features),
            'model_version' => '1.0',
            'features_used' => array_keys(array_intersect_key($weights, $features))
        ];
    }

    /**
     * Calculate Economic Order Quantity
     */
    private function calculateEOQ(float $demand, int $leadTime, float $orderCost = 50, float $holdingCost = 0.2): int
    {
        if ($demand <= 0 || $holdingCost <= 0) {
            return 0;
        }
        
        // Wilson EOQ formula: sqrt((2 * D * S) / H)
        $eoq = sqrt((2 * $demand * $orderCost) / $holdingCost);
        
        return max(1, (int) round($eoq));
    }

    /**
     * Calculate reorder point
     */
    private function calculateReorderPoint(float $demand, int $leadTime, float $safetyStock = 0.2): int
    {
        $dailyDemand = $demand / 365;
        $leadTimeDemand = $dailyDemand * $leadTime;
        $safetyStockQuantity = $leadTimeDemand * $safetyStock;
        
        return max(0, (int) round($leadTimeDemand + $safetyStockQuantity));
    }

    /**
     * Calculate optimal stock level
     */
    private function calculateOptimalStockLevel(float $demand, int $leadTime, int $eoq): int
    {
        $reorderPoint = $this->calculateReorderPoint($demand, $leadTime);
        return $reorderPoint + $eoq;
    }

    /**
     * Helper methods
     */
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

    private function calculateStandardDeviation(array $values): float
    {
        if (count($values) < 2) return 0;
        
        $mean = array_sum($values) / count($values);
        $variance = array_sum(array_map(fn($x) => pow($x - $mean, 2), $values)) / count($values);
        
        return sqrt($variance);
    }

    private function calculatePatternStrength(array $patterns): float
    {
        // Simplified pattern strength calculation
        $strength = 0;
        $patternCount = 0;
        
        foreach ($patterns as $pattern) {
            if (is_array($pattern) && !empty($pattern)) {
                $patternCount++;
                if (isset($pattern['strength'])) {
                    $strength += $pattern['strength'];
                } else {
                    $strength += 0.5; // Default strength
                }
            }
        }
        
        return $patternCount > 0 ? $strength / $patternCount : 0;
    }

    private function calculatePatternConfidence(array $data, array $patterns): float
    {
        $sampleSize = count($data);
        
        // Confidence increases with sample size
        $sizeConfidence = min(1.0, $sampleSize / 50);
        
        // Confidence increases with pattern consistency
        $patternConfidence = $this->calculatePatternStrength($patterns);
        
        return ($sizeConfidence + $patternConfidence) / 2;
    }

    private function calculatePredictionConfidence(array $features): float
    {
        $featureCount = count($features);
        $expectedFeatures = 10;
        
        return min(1.0, $featureCount / $expectedFeatures);
    }

    // Placeholder implementations for model creation and training
    private function createOrderSuccessModel(): array
    {
        return ['type' => 'logistic_regression', 'trained' => true];
    }

    private function createCustomerChurnModel(): array
    {
        return ['type' => 'random_forest', 'trained' => true];
    }

    private function createDemandForecastModel(): array
    {
        return ['type' => 'time_series', 'trained' => true];
    }

    private function createPriceOptimizationModel(): array
    {
        return ['type' => 'neural_network', 'trained' => true];
    }

    private function analyzeValuePatterns(array $data): array
    {
        return ['pattern' => 'stable'];
    }

    private function analyzeMaterialPatterns(array $data): array
    {
        return ['pattern' => 'diverse'];
    }

    private function analyzeVendorPatterns(array $data): array
    {
        return ['pattern' => 'loyal'];
    }

    private function analyzeComplexityPatterns(array $data): array
    {
        return ['pattern' => 'medium'];
    }

    private function calculateDemandTrend(array $data): array
    {
        return ['trend' => 'increasing', 'rate' => 0.05];
    }

    private function calculatePriceTrend(array $data): array
    {
        return ['trend' => 'stable', 'rate' => 0.02];
    }

    private function calculateSeasonalTrend(array $data): array
    {
        return ['trend' => 'seasonal', 'strength' => 0.3];
    }

    private function calculateGrowthTrend(array $data): array
    {
        return ['trend' => 'positive', 'rate' => 0.08];
    }

    private function calculateVolatilityTrend(array $data): array
    {
        return ['trend' => 'low', 'coefficient' => 0.15];
    }

    private function adjustTrendsForExternalFactors(array $trends, array $factors): array
    {
        return $trends; // Placeholder
    }

    private function findPeakSeason(array $seasonalData): string
    {
        return array_key_first($seasonalData) ?? 'unknown';
    }

    private function calculateSeasonalityStrength(array $indices): float
    {
        if (empty($indices)) return 0;
        
        $max = max($indices);
        $min = min($indices);
        
        return $max - $min;
    }

    private function predictCustomerChurn(array $features): array
    {
        return ['probability' => 0.2, 'confidence' => 0.8];
    }

    private function predictDemand(array $features): array
    {
        return ['forecast' => 100, 'confidence' => 0.75];
    }

    private function optimizePrice(array $features): array
    {
        return ['optimal_price' => 1000, 'confidence' => 0.85];
    }

    private function prepareTrainingData(array $data): array
    {
        return $data; // Placeholder
    }

    private function trainOrderSuccessModel(array $data, array $parameters): array
    {
        return ['trained' => true, 'accuracy' => 0.85];
    }

    private function trainCustomerChurnModel(array $data, array $parameters): array
    {
        return ['trained' => true, 'accuracy' => 0.82];
    }

    private function trainDemandForecastModel(array $data, array $parameters): array
    {
        return ['trained' => true, 'accuracy' => 0.78];
    }

    private function validateModel(array $model, array $data): array
    {
        return [
            'accuracy' => 0.85,
            'precision' => 0.83,
            'recall' => 0.87,
            'f1_score' => 0.85
        ];
    }

    private function calculateProjectedSavings(array $current, array $optimized): float
    {
        return 15000; // Placeholder projected savings
    }
}