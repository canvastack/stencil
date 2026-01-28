<?php

namespace App\Domain\Intelligence\Services;

use App\Domain\Intelligence\ValueObjects\SmartSearchResult;
use App\Domain\Intelligence\ValueObjects\SearchResultItem;
use App\Domain\Intelligence\Services\MachineLearningService;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Customer\Repositories\CustomerRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Product\Repositories\ProductRepositoryInterface;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Carbon\Carbon;

/**
 * Smart Search Service
 * 
 * Provides intelligent search functionality with AI-powered relevance ranking,
 * natural language processing, and cross-entity search capabilities.
 */
class SmartSearchService
{
    private array $searchableEntities;

    public function __construct(
        private MachineLearningService $mlService,
        private OrderRepositoryInterface $orderRepository,
        private CustomerRepositoryInterface $customerRepository,
        private VendorRepositoryInterface $vendorRepository,
        private ProductRepositoryInterface $productRepository
    ) {
        $this->initializeSearchableEntities();
    }

    /**
     * Perform intelligent search across multiple entities
     */
    public function search(
        string $query,
        int $userId,
        ?UuidValueObject $tenantId = null,
        array $types = ['all'],
        int $limit = 10,
        bool $includeSuggestions = true
    ): SmartSearchResult {
        $startTime = microtime(true);
        
        // Handle empty query early
        if (empty(trim($query))) {
            return new SmartSearchResult(
                results: [],
                suggestions: [],
                totalCount: 0,
                searchTime: round((microtime(true) - $startTime) * 1000, 2),
                queryAnalysis: ['original_query' => $query, 'normalized_query' => '', 'intent' => 'empty']
            );
        }
        
        // Analyze and normalize the query
        $queryAnalysis = $this->analyzeQuery($query);
        $normalizedQuery = $queryAnalysis['normalized_query'];
        
        // Determine which entities to search
        $searchTypes = $this->resolveSearchTypes($types);
        
        // Perform search across entities
        $results = [];
        foreach ($searchTypes as $type) {
            $entityResults = $this->searchEntity($type, $normalizedQuery, $tenantId, $userId);
            $results = array_merge($results, $entityResults);
        }
        
        // Apply ML-based relevance scoring
        $scoredResults = $this->applyRelevanceScoring($results, $queryAnalysis, $userId);
        
        // Sort by relevance and limit results
        usort($scoredResults, fn($a, $b) => $b->getRelevanceScore() <=> $a->getRelevanceScore());
        $limitedResults = array_slice($scoredResults, 0, $limit);
        
        // Generate suggestions if requested
        $suggestions = $includeSuggestions 
            ? $this->generateSearchSuggestions($query, $queryAnalysis, $userId, $tenantId)
            : [];
        
        $searchTime = round((microtime(true) - $startTime) * 1000, 2); // milliseconds
        
        return new SmartSearchResult(
            results: $limitedResults,
            suggestions: $suggestions,
            totalCount: count($results),
            searchTime: $searchTime,
            queryAnalysis: $queryAnalysis
        );
    }

    /**
     * Get search suggestions for auto-completion
     */
    public function getSuggestions(
        string $query,
        int $userId,
        ?UuidValueObject $tenantId = null,
        string $type = 'all',
        int $limit = 10
    ): array {
        $suggestions = [];
        
        // Get recent searches
        if ($type === 'all' || $type === 'recent') {
            $recentSearches = $this->getRecentSearches($userId, 5);
            foreach ($recentSearches as $search) {
                if (empty($query) || stripos($search['query'], $query) !== false) {
                    $suggestions[] = [
                        'text' => $search['query'],
                        'type' => 'recent',
                        'count' => $search['count']
                    ];
                }
            }
        }
        
        // Get trending searches
        if ($type === 'all' || $type === 'trending') {
            $trendingSearches = $this->getTrendingSearches($tenantId, 5);
            foreach ($trendingSearches as $search) {
                if (empty($query) || stripos($search['query'], $query) !== false) {
                    $suggestions[] = [
                        'text' => $search['query'],
                        'type' => 'trending',
                        'count' => $search['count']
                    ];
                }
            }
        }
        
        // Get completion suggestions
        if ($type === 'all' || $type === 'completion') {
            $completions = $this->getCompletionSuggestions($query, $tenantId, 5);
            foreach ($completions as $completion) {
                $suggestions[] = [
                    'text' => $completion,
                    'type' => 'completion'
                ];
            }
        }
        
        // Remove duplicates and limit
        $uniqueSuggestions = [];
        $seen = [];
        foreach ($suggestions as $suggestion) {
            $key = strtolower($suggestion['text']);
            if (!isset($seen[$key])) {
                $seen[$key] = true;
                $uniqueSuggestions[] = $suggestion;
            }
        }
        
        return array_slice($uniqueSuggestions, 0, $limit);
    }

    /**
     * Record search analytics for improving results
     */
    public function recordSearchAnalytics(
        string $query,
        int $userId,
        ?UuidValueObject $tenantId = null,
        ?string $resultClicked = null,
        ?int $resultPosition = null,
        ?string $searchSessionId = null
    ): void {
        $analytics = [
            'query' => $query,
            'user_id' => $userId,
            'tenant_id' => $tenantId?->getValue(),
            'result_clicked' => $resultClicked,
            'result_position' => $resultPosition,
            'search_session_id' => $searchSessionId,
            'timestamp' => now()->toISOString()
        ];
        
        // Store in cache for immediate use
        $cacheKey = "search_analytics_{$userId}_" . date('Y-m-d');
        $dailyAnalytics = Cache::get($cacheKey, []);
        $dailyAnalytics[] = $analytics;
        Cache::put($cacheKey, $dailyAnalytics, 86400); // 24 hours
        
        // In a real implementation, this would also store in database
        // for long-term analytics and ML model training
    }

    /**
     * Get search analytics and insights
     */
    public function getSearchAnalytics(
        int $userId,
        ?UuidValueObject $tenantId = null,
        int $days = 30
    ): array {
        $analytics = [
            'total_searches' => 0,
            'unique_queries' => 0,
            'top_queries' => [],
            'search_trends' => [],
            'click_through_rate' => 0,
            'average_results_per_search' => 0
        ];
        
        // Aggregate analytics from cache (in real implementation, from database)
        for ($i = 0; $i < $days; $i++) {
            $date = now()->subDays($i)->format('Y-m-d');
            $cacheKey = "search_analytics_{$userId}_{$date}";
            $dailyData = Cache::get($cacheKey, []);
            
            $analytics['total_searches'] += count($dailyData);
            
            // Process daily data for insights
            foreach ($dailyData as $search) {
                // Count unique queries, clicks, etc.
            }
        }
        
        return $analytics;
    }

    /**
     * Initialize searchable entities configuration
     */
    private function initializeSearchableEntities(): void
    {
        $this->searchableEntities = [
            'orders' => [
                'repository' => 'orderRepository',
                'fields' => ['order_number', 'customer_name', 'vendor_name', 'items', 'notes'],
                'weights' => ['order_number' => 1.0, 'customer_name' => 0.8, 'vendor_name' => 0.6, 'items' => 0.7, 'notes' => 0.3]
            ],
            'customers' => [
                'repository' => 'customerRepository',
                'fields' => ['name', 'email', 'phone', 'company', 'address'],
                'weights' => ['name' => 1.0, 'email' => 0.9, 'company' => 0.8, 'phone' => 0.7, 'address' => 0.5]
            ],
            'vendors' => [
                'repository' => 'vendorRepository',
                'fields' => ['name', 'email', 'phone', 'company', 'specialties', 'address'],
                'weights' => ['name' => 1.0, 'company' => 0.9, 'specialties' => 0.8, 'email' => 0.7, 'phone' => 0.6, 'address' => 0.4]
            ],
            'products' => [
                'repository' => 'productRepository',
                'fields' => ['name', 'description', 'sku', 'category', 'tags'],
                'weights' => ['name' => 1.0, 'sku' => 0.9, 'category' => 0.7, 'description' => 0.6, 'tags' => 0.5]
            ]
        ];
    }

    /**
     * Analyze search query for better understanding
     */
    private function analyzeQuery(string $query): array
    {
        $normalized = strtolower(trim($query));
        
        // Remove special characters but keep spaces and numbers
        $cleaned = preg_replace('/[^\w\s\-]/', '', $normalized);
        
        // Extract potential identifiers (order numbers, SKUs, etc.)
        $identifiers = [];
        if (preg_match_all('/\b[A-Z0-9]{3,}\b/i', $query, $matches)) {
            $identifiers = $matches[0];
        }
        
        // Extract potential names (capitalized words)
        $names = [];
        if (preg_match_all('/\b[A-Z][a-z]+\b/', $query, $matches)) {
            $names = $matches[0];
        }
        
        // Determine query intent
        $intent = $this->determineQueryIntent($cleaned);
        
        return [
            'original_query' => $query,
            'normalized_query' => $cleaned,
            'identifiers' => $identifiers,
            'names' => $names,
            'intent' => $intent,
            'word_count' => str_word_count($cleaned),
            'has_numbers' => preg_match('/\d/', $query) === 1
        ];
    }

    /**
     * Determine the intent of the search query
     */
    private function determineQueryIntent(string $query): string
    {
        // Check for specific patterns
        if (preg_match('/\b(order|po|purchase)\b/', $query)) {
            return 'order_search';
        }
        
        if (preg_match('/\b(customer|client)\b/', $query)) {
            return 'customer_search';
        }
        
        if (preg_match('/\b(vendor|supplier)\b/', $query)) {
            return 'vendor_search';
        }
        
        if (preg_match('/\b(product|item|sku)\b/', $query)) {
            return 'product_search';
        }
        
        // Check for identifier patterns
        if (preg_match('/^[A-Z0-9\-]{5,}$/', $query)) {
            return 'identifier_search';
        }
        
        return 'general_search';
    }

    /**
     * Resolve search types from input
     */
    private function resolveSearchTypes(array $types): array
    {
        if (in_array('all', $types)) {
            return array_keys($this->searchableEntities);
        }
        
        return array_intersect($types, array_keys($this->searchableEntities));
    }

    /**
     * Search within a specific entity type
     */
    private function searchEntity(string $type, string $query, ?UuidValueObject $tenantId, int $userId): array
    {
        $config = $this->searchableEntities[$type];
        $repository = $this->{$config['repository']};
        
        // Get entities for the tenant
        $entities = $repository->findByTenant($tenantId);
        
        $results = [];
        foreach ($entities as $entity) {
            $relevanceScore = $this->calculateEntityRelevance($entity, $query, $config);
            
            if ($relevanceScore > 0.1) { // Minimum relevance threshold
                $results[] = new SearchResultItem(
                    id: $entity->getId()->getValue(),
                    type: $type,
                    title: $this->getEntityTitle($entity, $type),
                    subtitle: $this->getEntitySubtitle($entity, $type),
                    description: $this->getEntityDescription($entity, $type),
                    url: $this->getEntityUrl($entity, $type),
                    relevanceScore: $relevanceScore,
                    metadata: $this->getEntityMetadata($entity, $type)
                );
            }
        }
        
        return $results;
    }

    /**
     * Calculate relevance score for an entity
     */
    private function calculateEntityRelevance($entity, string $query, array $config): float
    {
        $totalScore = 0;
        $maxPossibleScore = 0;
        
        foreach ($config['fields'] as $field) {
            $fieldValue = $this->getEntityFieldValue($entity, $field);
            $fieldWeight = $config['weights'][$field] ?? 0.5;
            
            $fieldScore = $this->calculateFieldRelevance($fieldValue, $query) * $fieldWeight;
            $totalScore += $fieldScore;
            $maxPossibleScore += $fieldWeight;
        }
        
        return $maxPossibleScore > 0 ? $totalScore / $maxPossibleScore : 0;
    }

    /**
     * Calculate relevance score for a specific field
     */
    private function calculateFieldRelevance(string $fieldValue, string $query): float
    {
        if (empty($fieldValue) || empty($query)) {
            return 0;
        }
        
        $fieldValue = strtolower($fieldValue);
        $query = strtolower($query);
        
        // Exact match gets highest score
        if ($fieldValue === $query) {
            return 1.0;
        }
        
        // Starts with query gets high score
        if (strpos($fieldValue, $query) === 0) {
            return 0.9;
        }
        
        // Contains query gets medium score
        if (strpos($fieldValue, $query) !== false) {
            return 0.7;
        }
        
        // Word-level matching
        $fieldWords = explode(' ', $fieldValue);
        $queryWords = explode(' ', $query);
        
        $matchingWords = 0;
        foreach ($queryWords as $queryWord) {
            foreach ($fieldWords as $fieldWord) {
                if (strpos($fieldWord, $queryWord) !== false) {
                    $matchingWords++;
                    break;
                }
            }
        }
        
        if ($matchingWords > 0) {
            return ($matchingWords / count($queryWords)) * 0.5;
        }
        
        // Fuzzy matching for typos
        $similarity = 0;
        similar_text($fieldValue, $query, $similarity);
        
        return $similarity > 70 ? ($similarity / 100) * 0.3 : 0;
    }

    /**
     * Apply ML-based relevance scoring
     */
    private function applyRelevanceScoring(array $results, array $queryAnalysis, int $userId): array
    {
        // Get user search preferences and history
        $userPreferences = $this->getUserSearchPreferences($userId);
        
        foreach ($results as $result) {
            // Apply user preference boost
            $preferenceBoost = $this->calculatePreferenceBoost($result, $userPreferences);
            
            // Apply recency boost for time-sensitive entities
            $recencyBoost = $this->calculateRecencyBoost($result);
            
            // Apply ML-based contextual scoring
            $contextualScore = $this->mlService->calculateContextualRelevance(
                $result->toArray(),
                $queryAnalysis,
                $userPreferences
            );
            
            // Combine scores
            $finalScore = $result->getRelevanceScore() * (1 + $preferenceBoost + $recencyBoost + $contextualScore);
            $result->setRelevanceScore(min(1.0, $finalScore));
        }
        
        return $results;
    }

    /**
     * Generate search suggestions based on query and context
     */
    private function generateSearchSuggestions(
        string $query,
        array $queryAnalysis,
        int $userId,
        ?UuidValueObject $tenantId
    ): array {
        $suggestions = [];
        
        // Add completion suggestions
        if (strlen($query) >= 2) {
            $completions = $this->getCompletionSuggestions($query, $tenantId, 3);
            foreach ($completions as $completion) {
                $suggestions[] = [
                    'text' => $completion,
                    'type' => 'completion'
                ];
            }
        }
        
        // Add related searches
        $relatedSearches = $this->getRelatedSearches($query, $userId, 2);
        foreach ($relatedSearches as $related) {
            $suggestions[] = [
                'text' => $related,
                'type' => 'related'
            ];
        }
        
        return $suggestions;
    }

    // Helper methods for entity data extraction

    private function getEntityTitle($entity, string $type): string
    {
        return match($type) {
            'orders' => $entity->getOrderNumber(),
            'customers' => $entity->getName(),
            'vendors' => $entity->getName(),
            'products' => $entity->getName(),
            default => 'Unknown'
        };
    }

    private function getEntitySubtitle($entity, string $type): string
    {
        return match($type) {
            'orders' => $entity->getCustomer()?->getName() ?? 'No customer',
            'customers' => $entity->getEmail() ?? $entity->getPhone() ?? '',
            'vendors' => $entity->getCompany() ?? $entity->getEmail() ?? '',
            'products' => $entity->getSku() ?? $entity->getCategory() ?? '',
            default => ''
        };
    }

    private function getEntityDescription($entity, string $type): ?string
    {
        return match($type) {
            'orders' => "Total: " . $entity->getTotalAmount()->format() . " | Status: " . $entity->getStatus()->value,
            'customers' => $entity->getCompany() ?? $entity->getAddress()?->toString(),
            'vendors' => implode(', ', $entity->getSpecialties() ?? []),
            'products' => $entity->getDescription(),
            default => null
        };
    }

    private function getEntityUrl($entity, string $type): string
    {
        $id = $entity->getId()->getValue();
        return match($type) {
            'orders' => "/admin/orders/{$id}",
            'customers' => "/admin/customers/{$id}",
            'vendors' => "/admin/vendors/{$id}",
            'products' => "/admin/products/{$id}",
            default => "/admin"
        };
    }

    private function getEntityMetadata($entity, string $type): array
    {
        return match($type) {
            'orders' => [
                'status' => $entity->getStatus()->value,
                'total_amount' => $entity->getTotalAmount()->getAmount(),
                'created_at' => $entity->getCreatedAt()->toISOString()
            ],
            'customers' => [
                'email' => $entity->getEmail(),
                'phone' => $entity->getPhone(),
                'company' => $entity->getCompany()
            ],
            'vendors' => [
                'rating' => $entity->getRating(),
                'lead_time' => $entity->getLeadTime(),
                'specialties' => $entity->getSpecialties()
            ],
            'products' => [
                'sku' => $entity->getSku(),
                'price' => $entity->getPrice()->getAmount(),
                'category' => $entity->getCategory()
            ],
            default => []
        };
    }

    private function getEntityFieldValue($entity, string $field): string
    {
        // This would be implemented based on entity structure
        // For now, return empty string as placeholder
        return '';
    }

    // Placeholder methods for analytics and preferences

    private function getUserSearchPreferences(int $userId): array
    {
        return Cache::remember("user_search_prefs_{$userId}", 3600, function() {
            return ['preferred_types' => [], 'search_history' => []];
        });
    }

    private function calculatePreferenceBoost($result, array $preferences): float
    {
        return 0.0; // Placeholder
    }

    private function calculateRecencyBoost($result): float
    {
        return 0.0; // Placeholder
    }

    private function getRecentSearches(int $userId, int $limit): array
    {
        return []; // Placeholder
    }

    private function getTrendingSearches(?UuidValueObject $tenantId, int $limit): array
    {
        return []; // Placeholder
    }

    private function getCompletionSuggestions(string $query, ?UuidValueObject $tenantId, int $limit): array
    {
        return []; // Placeholder
    }

    private function getRelatedSearches(string $query, int $userId, int $limit): array
    {
        return []; // Placeholder
    }
}