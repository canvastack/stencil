<?php

namespace App\Domain\Intelligence\Services;

use App\Domain\Intelligence\ValueObjects\VoiceCommandResult;
use App\Domain\Intelligence\ValueObjects\VoicePattern;
use App\Domain\Intelligence\Services\MachineLearningService;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Voice Command Service
 * 
 * Processes natural language voice commands and converts them into
 * structured actions for the application interface.
 */
class VoiceCommandService
{
    private array $commandPatterns;
    private array $entityMappings;

    public function __construct(
        private MachineLearningService $mlService
    ) {
        $this->initializeCommandPatterns();
        $this->initializeEntityMappings();
    }

    /**
     * Process a voice command and return structured result
     */
    public function processCommand(
        string $command,
        int $userId,
        ?UuidValueObject $tenantId = null,
        array $context = [],
        array $userPreferences = []
    ): VoiceCommandResult {
        // Normalize and clean the command
        $normalizedCommand = $this->normalizeCommand($command);
        
        // Get user-specific patterns for improved accuracy
        $userPatterns = $this->getUserPatterns($userId);
        
        // Try to match against known patterns
        $matchResult = $this->matchCommandPattern($normalizedCommand, $userPatterns);
        
        if ($matchResult['confidence'] > 0.6) {
            return new VoiceCommandResult(
                isSuccessful: true,
                action: $matchResult['action'],
                parameters: $matchResult['parameters'],
                confidence: $matchResult['confidence'],
                response: $this->generateResponse($matchResult),
                suggestions: []
            );
        }
        
        // If no direct match, try ML-based intent recognition
        $mlResult = $this->mlService->recognizeIntent($normalizedCommand, $context);
        
        if ($mlResult['confidence'] > 0.5) {
            $action = $this->mapIntentToAction($mlResult['intent']);
            $parameters = $this->extractParameters($normalizedCommand, $mlResult);
            
            return new VoiceCommandResult(
                isSuccessful: true,
                action: $action,
                parameters: $parameters,
                confidence: $mlResult['confidence'],
                response: $this->generateMLResponse($mlResult),
                suggestions: []
            );
        }
        
        // Command not recognized - provide suggestions
        $suggestions = $this->generateSuggestions($normalizedCommand);
        
        return new VoiceCommandResult(
            isSuccessful: false,
            action: 'unknown',
            parameters: [],
            confidence: max($matchResult['confidence'], $mlResult['confidence'] ?? 0),
            response: "I didn't understand that command. Here are some suggestions:",
            suggestions: $suggestions
        );
    }

    /**
     * Get available voice commands for the user
     */
    public function getAvailableCommands(int $userId, ?UuidValueObject $tenantId = null): array
    {
        $baseCommands = [
            'navigation' => [
                'Go to dashboard',
                'Show me orders',
                'Open customer management',
                'Navigate to vendors',
                'Show analytics',
                'Open settings'
            ],
            'search' => [
                'Search for [customer name]',
                'Find order [order number]',
                'Look for products containing [keyword]',
                'Show me vendors in [location]'
            ],
            'actions' => [
                'Create new order',
                'Add customer',
                'Update order status',
                'Export customer data',
                'Generate report'
            ],
            'information' => [
                'What is the status of order [number]?',
                'How many orders today?',
                'Show me top customers',
                'What are pending orders?'
            ]
        ];

        // Add user-specific commands if available
        $userCommands = $this->getUserCustomCommands($userId);
        if (!empty($userCommands)) {
            $baseCommands['custom'] = $userCommands;
        }

        return $baseCommands;
    }

    /**
     * Get command categories for organization
     */
    public function getCommandCategories(): array
    {
        return [
            'navigation' => [
                'name' => 'Navigation',
                'description' => 'Commands to navigate between different sections',
                'icon' => 'navigation'
            ],
            'search' => [
                'name' => 'Search & Find',
                'description' => 'Commands to search for specific items or data',
                'icon' => 'search'
            ],
            'actions' => [
                'name' => 'Actions',
                'description' => 'Commands to perform specific actions',
                'icon' => 'play'
            ],
            'information' => [
                'name' => 'Information',
                'description' => 'Commands to get information and status updates',
                'icon' => 'info'
            ]
        ];
    }

    /**
     * Train user-specific voice patterns
     */
    public function trainUserPattern(
        int $userId,
        string $command,
        string $intendedAction,
        array $parameters = []
    ): VoicePattern {
        $normalizedCommand = $this->normalizeCommand($command);
        
        // Create pattern
        $pattern = new VoicePattern(
            id: Str::uuid(),
            userId: $userId,
            command: $normalizedCommand,
            action: $intendedAction,
            parameters: $parameters,
            confidence: 1.0, // User-trained patterns have high confidence
            createdAt: now()
        );
        
        // Store pattern in cache and database
        $this->storeUserPattern($pattern);
        
        // Calculate confidence improvement
        $previousConfidence = $this->getPreviousConfidence($userId, $normalizedCommand);
        $confidenceImprovement = 1.0 - $previousConfidence;
        
        return $pattern->withConfidenceImprovement($confidenceImprovement);
    }

    /**
     * Initialize command patterns
     */
    private function initializeCommandPatterns(): void
    {
        $this->commandPatterns = [
            // Navigation patterns
            'navigation' => [
                '/^(?:go to|open|show|navigate to)\s+(dashboard|home)$/i' => [
                    'action' => 'navigate',
                    'parameters' => ['route' => '/admin']
                ],
                '/^(?:go to|open|show)\s+(orders?|order management)$/i' => [
                    'action' => 'navigate',
                    'parameters' => ['route' => '/admin/orders']
                ],
                '/^(?:go to|open|show)\s+(customers?|customer management)$/i' => [
                    'action' => 'navigate',
                    'parameters' => ['route' => '/admin/customers']
                ],
                '/^(?:go to|open|show)\s+(vendors?|vendor management)$/i' => [
                    'action' => 'navigate',
                    'parameters' => ['route' => '/admin/vendors']
                ],
                '/^(?:go to|open|show)\s+(products?|product management)$/i' => [
                    'action' => 'navigate',
                    'parameters' => ['route' => '/admin/products']
                ],
                '/^(?:go to|open|show)\s+(analytics|reports?)$/i' => [
                    'action' => 'navigate',
                    'parameters' => ['route' => '/admin/analytics']
                ]
            ],
            
            // Search patterns
            'search' => [
                '/^(?:search for|find|look for)\s+(.+)$/i' => [
                    'action' => 'search',
                    'parameters' => ['query' => '$1']
                ],
                '/^(?:show me|display)\s+(.+)$/i' => [
                    'action' => 'search',
                    'parameters' => ['query' => '$1']
                ]
            ],
            
            // Action patterns
            'actions' => [
                '/^(?:create|add|new)\s+(order|customer|vendor|product)$/i' => [
                    'action' => 'create',
                    'parameters' => ['entity' => '$1']
                ],
                '/^(?:update|edit|modify)\s+(.+)$/i' => [
                    'action' => 'update',
                    'parameters' => ['entity' => '$1']
                ],
                '/^(?:delete|remove)\s+(.+)$/i' => [
                    'action' => 'delete',
                    'parameters' => ['entity' => '$1']
                ],
                '/^(?:export|download)\s+(.+)$/i' => [
                    'action' => 'export',
                    'parameters' => ['entity' => '$1']
                ]
            ],
            
            // Status patterns
            'status' => [
                '/^(?:what is|show me)\s+(?:the\s+)?status\s+of\s+(.+)$/i' => [
                    'action' => 'show_status',
                    'parameters' => ['entity' => '$1']
                ],
                '/^(?:how many|count)\s+(.+)$/i' => [
                    'action' => 'count',
                    'parameters' => ['entity' => '$1']
                ]
            ]
        ];
    }

    /**
     * Initialize entity mappings
     */
    private function initializeEntityMappings(): void
    {
        $this->entityMappings = [
            'order' => ['orders', 'order', 'purchase order', 'po'],
            'customer' => ['customers', 'customer', 'client', 'clients'],
            'vendor' => ['vendors', 'vendor', 'supplier', 'suppliers'],
            'product' => ['products', 'product', 'item', 'items'],
            'analytics' => ['analytics', 'reports', 'report', 'dashboard', 'metrics'],
            'settings' => ['settings', 'configuration', 'config', 'preferences']
        ];
    }

    /**
     * Normalize command for processing
     */
    private function normalizeCommand(string $command): string
    {
        // Convert to lowercase and trim
        $normalized = strtolower(trim($command));
        
        // Remove punctuation
        $normalized = preg_replace('/[^\w\s]/', '', $normalized);
        
        // Normalize whitespace
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        
        return $normalized;
    }

    /**
     * Match command against patterns
     */
    private function matchCommandPattern(string $command, array $userPatterns = []): array
    {
        $bestMatch = ['confidence' => 0, 'action' => null, 'parameters' => []];
        
        // First check user-specific patterns (higher priority)
        foreach ($userPatterns as $pattern) {
            $similarity = $this->calculateSimilarity($command, $pattern['command']);
            if ($similarity > $bestMatch['confidence']) {
                $bestMatch = [
                    'confidence' => $similarity,
                    'action' => $pattern['action'],
                    'parameters' => $pattern['parameters']
                ];
            }
        }
        
        // Then check system patterns
        foreach ($this->commandPatterns as $category => $patterns) {
            foreach ($patterns as $regex => $config) {
                if (preg_match($regex, $command, $matches)) {
                    $confidence = 0.8; // Base confidence for regex matches
                    
                    if ($confidence > $bestMatch['confidence']) {
                        $parameters = $config['parameters'];
                        
                        // Replace parameter placeholders with actual matches
                        foreach ($parameters as $key => $value) {
                            if (is_string($value) && strpos($value, '$') === 0) {
                                $matchIndex = (int) substr($value, 1);
                                if (isset($matches[$matchIndex])) {
                                    $parameters[$key] = $matches[$matchIndex];
                                }
                            }
                        }
                        
                        $bestMatch = [
                            'confidence' => $confidence,
                            'action' => $config['action'],
                            'parameters' => $parameters
                        ];
                    }
                }
            }
        }
        
        return $bestMatch;
    }

    /**
     * Calculate similarity between two commands
     */
    private function calculateSimilarity(string $command1, string $command2): float
    {
        // Use Levenshtein distance for similarity calculation
        $maxLength = max(strlen($command1), strlen($command2));
        if ($maxLength === 0) return 1.0;
        
        $distance = levenshtein($command1, $command2);
        return 1 - ($distance / $maxLength);
    }

    /**
     * Get user-specific patterns from cache/database
     */
    private function getUserPatterns(int $userId): array
    {
        return Cache::remember("user_voice_patterns_{$userId}", 3600, function () use ($userId) {
            // In a real implementation, this would fetch from database
            // For now, return empty array
            return [];
        });
    }

    /**
     * Map ML intent to action
     */
    private function mapIntentToAction(string $intent): string
    {
        $intentMap = [
            'navigate' => 'navigate',
            'search' => 'search',
            'create' => 'create',
            'update' => 'update',
            'delete' => 'delete',
            'export' => 'export',
            'status' => 'show_status',
            'count' => 'count'
        ];
        
        return $intentMap[$intent] ?? 'unknown';
    }

    /**
     * Extract parameters from command using ML result
     */
    private function extractParameters(string $command, array $mlResult): array
    {
        $parameters = [];
        
        // Extract entities from ML result
        if (isset($mlResult['entities'])) {
            foreach ($mlResult['entities'] as $entity) {
                $parameters[$entity['type']] = $entity['value'];
            }
        }
        
        // Add route mapping if it's a navigation command
        if ($mlResult['intent'] === 'navigate' && isset($parameters['target'])) {
            $parameters['route'] = $this->getRouteForEntity($parameters['target']);
        }
        
        return $parameters;
    }

    /**
     * Get route for entity
     */
    private function getRouteForEntity(string $entity): string
    {
        $routes = [
            'dashboard' => '/admin',
            'orders' => '/admin/orders',
            'customers' => '/admin/customers',
            'vendors' => '/admin/vendors',
            'products' => '/admin/products',
            'analytics' => '/admin/analytics',
            'settings' => '/admin/settings'
        ];
        
        // Normalize entity name
        $normalizedEntity = strtolower($entity);
        foreach ($this->entityMappings as $canonical => $aliases) {
            if (in_array($normalizedEntity, $aliases)) {
                return $routes[$canonical] ?? '/admin';
            }
        }
        
        return $routes[$normalizedEntity] ?? '/admin';
    }

    /**
     * Generate response for successful command
     */
    private function generateResponse(array $matchResult): string
    {
        $action = $matchResult['action'];
        $parameters = $matchResult['parameters'];
        
        switch ($action) {
            case 'navigate':
                $route = $parameters['route'] ?? '';
                return "Navigating to {$this->getPageName($route)}";
            case 'search':
                $query = $parameters['query'] ?? 'items';
                return "Searching for '{$query}'";
            case 'create':
                $entity = $parameters['entity'] ?? 'item';
                return "Opening form to create new {$entity}";
            case 'update':
                $entity = $parameters['entity'] ?? 'item';
                return "Opening editor for {$entity}";
            case 'delete':
                $entity = $parameters['entity'] ?? 'item';
                return "Preparing to delete {$entity}";
            case 'export':
                $entity = $parameters['entity'] ?? 'data';
                return "Preparing to export {$entity}";
            case 'show_status':
                $entity = $parameters['entity'] ?? 'item';
                return "Showing status for {$entity}";
            case 'count':
                $entity = $parameters['entity'] ?? 'items';
                return "Counting {$entity}";
            default:
                return "Executing command";
        }
    }

    /**
     * Generate ML-based response
     */
    private function generateMLResponse(array $mlResult): string
    {
        $intent = $mlResult['intent'];
        $confidence = $mlResult['confidence'];
        
        $confidenceText = $confidence > 0.8 ? "I'm confident" : "I think";
        
        return "{$confidenceText} you want to {$intent}. Let me help you with that.";
    }

    /**
     * Generate suggestions for unrecognized commands
     */
    private function generateSuggestions(string $command): array
    {
        $suggestions = [];
        
        // Find similar commands
        $allCommands = $this->getAllKnownCommands();
        
        foreach ($allCommands as $knownCommand) {
            $similarity = $this->calculateSimilarity($command, $knownCommand);
            if ($similarity > 0.5) {
                $suggestions[] = $knownCommand;
            }
        }
        
        // Sort by similarity and take top 3
        usort($suggestions, function($a, $b) use ($command) {
            $simA = $this->calculateSimilarity($command, $a);
            $simB = $this->calculateSimilarity($command, $b);
            return $simB <=> $simA;
        });
        
        return array_slice($suggestions, 0, 3);
    }

    /**
     * Get all known commands for suggestions
     */
    private function getAllKnownCommands(): array
    {
        return [
            'go to dashboard',
            'show me orders',
            'open customer management',
            'navigate to vendors',
            'show analytics',
            'search for customers',
            'create new order',
            'add customer',
            'update order status',
            'export customer data',
            'what is the status of orders',
            'how many orders today'
        ];
    }

    /**
     * Get page name from route
     */
    private function getPageName(string $route): string
    {
        $pageNames = [
            '/admin' => 'dashboard',
            '/admin/orders' => 'orders page',
            '/admin/customers' => 'customer management',
            '/admin/vendors' => 'vendor management',
            '/admin/products' => 'product management',
            '/admin/analytics' => 'analytics dashboard',
            '/admin/settings' => 'settings page'
        ];
        
        return $pageNames[$route] ?? 'the requested page';
    }

    /**
     * Get user custom commands
     */
    private function getUserCustomCommands(int $userId): array
    {
        // In a real implementation, this would fetch from database
        return [];
    }

    /**
     * Store user pattern
     */
    private function storeUserPattern(VoicePattern $pattern): void
    {
        // In a real implementation, this would store in database
        // For now, just cache it
        $cacheKey = "user_voice_patterns_{$pattern->getUserId()}";
        $patterns = Cache::get($cacheKey, []);
        $patterns[] = $pattern->toArray();
        Cache::put($cacheKey, $patterns, 3600);
    }

    /**
     * Get previous confidence for command
     */
    private function getPreviousConfidence(int $userId, string $command): float
    {
        $patterns = $this->getUserPatterns($userId);
        
        foreach ($patterns as $pattern) {
            if ($this->calculateSimilarity($command, $pattern['command']) > 0.8) {
                return $pattern['confidence'] ?? 0.5;
            }
        }
        
        return 0.5; // Default confidence
    }
}