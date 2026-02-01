<?php

namespace App\Domain\Intelligence\Services;

use App\Domain\Intelligence\ValueObjects\ChatbotResponse;
use App\Domain\Intelligence\ValueObjects\ChatbotIntent;
use App\Domain\Intelligence\ValueObjects\ChatbotEntity;
use App\Domain\Intelligence\Services\MachineLearningService;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Product\Repositories\ProductRepositoryInterface;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Chatbot Service
 * 
 * Provides NLP-powered customer support with intent recognition,
 * entity extraction, and contextual response generation.
 */
class ChatbotService
{
    private array $intentPatterns;
    private array $entityPatterns;
    private array $responseTemplates;

    public function __construct(
        private MachineLearningService $mlService,
        private OrderRepositoryInterface $orderRepository,
        private ProductRepositoryInterface $productRepository,
        private VendorRepositoryInterface $vendorRepository
    ) {
        $this->initializeIntentPatterns();
        $this->initializeEntityPatterns();
        $this->initializeResponseTemplates();
    }

    /**
     * Process customer query and generate response
     */
    public function processCustomerQuery(
        string $query,
        ?Customer $customer = null,
        array $context = []
    ): ChatbotResponse {
        // Normalize and analyze the query
        $normalizedQuery = $this->normalizeQuery($query);
        
        // Extract intent from the query
        $intent = $this->analyzeIntent($normalizedQuery);
        
        // Extract entities from the query
        $entities = $this->extractEntities($normalizedQuery);
        
        // Generate response based on intent and entities
        $response = $this->generateResponse($intent, $entities, $customer, $context);
        
        // Store conversation for learning
        $this->storeConversation($query, $intent, $entities, $response, $customer);
        
        return $response;
    }

    /**
     * Get chatbot capabilities and available commands
     */
    public function getCapabilities(): array
    {
        return [
            'intents' => [
                'order_status' => 'Check order status and tracking information',
                'pricing_inquiry' => 'Get pricing information for products and services',
                'product_information' => 'Learn about products, specifications, and availability',
                'support_request' => 'Get help with technical issues or general questions',
                'appointment_booking' => 'Schedule consultations or service appointments',
                'complaint_handling' => 'Report issues and track complaint resolution',
                'general_inquiry' => 'General questions about services and policies'
            ],
            'entities' => [
                'order_number' => 'Order identification numbers',
                'product_name' => 'Product names and SKUs',
                'customer_info' => 'Customer names, emails, and phone numbers',
                'date_time' => 'Dates and time references',
                'location' => 'Addresses and geographic locations',
                'price_range' => 'Budget and pricing information'
            ],
            'languages' => ['en', 'id', 'zh', 'ja'],
            'confidence_threshold' => 0.7
        ];
    }

    /**
     * Train chatbot with new conversation data
     */
    public function trainWithConversation(
        string $query,
        string $expectedIntent,
        array $expectedEntities,
        string $correctResponse,
        ?Customer $customer = null
    ): void {
        // Store training data
        $trainingData = [
            'query' => $query,
            'expected_intent' => $expectedIntent,
            'expected_entities' => $expectedEntities,
            'correct_response' => $correctResponse,
            'customer_id' => $customer?->getId()->getValue(),
            'timestamp' => now()->toISOString()
        ];
        
        // Cache training data for ML model updates
        $cacheKey = 'chatbot_training_' . date('Y-m-d');
        $dailyTraining = Cache::get($cacheKey, []);
        $dailyTraining[] = $trainingData;
        Cache::put($cacheKey, $dailyTraining, 86400); // 24 hours
        
        // Update ML model with new training data
        $this->mlService->updateModel('chatbot_intent', $trainingData);
    }

    /**
     * Analyze intent from query
     */
    private function analyzeIntent(string $query): ChatbotIntent
    {
        // Try pattern matching first
        foreach ($this->intentPatterns as $intent => $patterns) {
            foreach ($patterns as $pattern) {
                if (preg_match($pattern, $query)) {
                    return new ChatbotIntent(
                        intent: $intent,
                        confidence: 0.9,
                        method: 'pattern_matching'
                    );
                }
            }
        }
        
        // Use ML-based intent recognition
        $mlResult = $this->mlService->recognizeIntent($query, []);
        
        if ($mlResult['confidence'] > 0.6) {
            return new ChatbotIntent(
                intent: $mlResult['intent'],
                confidence: $mlResult['confidence'],
                method: 'machine_learning'
            );
        }
        
        // Default to general inquiry
        return new ChatbotIntent(
            intent: 'general_inquiry',
            confidence: 0.5,
            method: 'fallback'
        );
    }

    /**
     * Extract entities from query
     */
    private function extractEntities(string $query): array
    {
        $entities = [];
        
        // Extract using regex patterns
        foreach ($this->entityPatterns as $entityType => $patterns) {
            foreach ($patterns as $pattern) {
                if (preg_match_all($pattern, $query, $matches)) {
                    foreach ($matches[1] as $match) {
                        $entities[] = new ChatbotEntity(
                            type: $entityType,
                            value: trim($match),
                            confidence: 0.8,
                            startPos: strpos($query, $match),
                            endPos: strpos($query, $match) + strlen($match)
                        );
                    }
                }
            }
        }
        
        // Use ML service for intent recognition which includes entities
        $mlResult = $this->mlService->recognizeIntent($query, []);
        if (isset($mlResult['entities']) && is_array($mlResult['entities'])) {
            foreach ($mlResult['entities'] as $entity) {
                $entities[] = new ChatbotEntity(
                    type: $entity['type'],
                    value: $entity['value'],
                    confidence: $entity['confidence'],
                    startPos: $entity['start'] ?? 0,
                    endPos: $entity['end'] ?? strlen($entity['value'])
                );
            }
        }
        
        return $entities;
    }

    /**
     * Generate response based on intent and entities
     */
    private function generateResponse(
        ChatbotIntent $intent,
        array $entities,
        ?Customer $customer,
        array $context
    ): ChatbotResponse {
        $intentType = $intent->getIntent();
        
        return match($intentType) {
            'order_status' => $this->handleOrderStatusQuery($entities, $customer),
            'pricing_inquiry' => $this->handlePricingInquiry($entities, $customer),
            'product_information' => $this->handleProductInquiry($entities),
            'support_request' => $this->handleSupportRequest($entities, $customer),
            'appointment_booking' => $this->handleAppointmentBooking($entities, $customer),
            'complaint_handling' => $this->handleComplaintHandling($entities, $customer),
            default => $this->handleGeneralQuery($entities, $customer)
        };
    }

    /**
     * Handle order status queries
     */
    private function handleOrderStatusQuery(array $entities, ?Customer $customer): ChatbotResponse
    {
        // Extract order number from entities
        $orderNumber = null;
        foreach ($entities as $entity) {
            if ($entity->getType() === 'order_number') {
                $orderNumber = $entity->getValue();
                break;
            }
        }
        
        if (!$orderNumber && !$customer) {
            return new ChatbotResponse(
                message: "I'd be happy to help you check your order status! Could you please provide your order number?",
                actions: ['request_order_number'],
                confidence: 0.9,
                requiresHumanHandoff: false,
                suggestedResponses: [
                    "My order number is...",
                    "I don't have my order number",
                    "Show me my recent orders"
                ]
            );
        }
        
        if ($orderNumber) {
            // Look up order by number
            $order = $this->orderRepository->findByOrderNumber($orderNumber);
            
            if ($order) {
                $status = $order->getStatus()->value;
                $customerName = $order->getCustomer()->getName();
                
                return new ChatbotResponse(
                    message: "I found your order #{$orderNumber}! Here's the current status:\n\n" .
                            "📦 Status: " . ucfirst(str_replace('_', ' ', $status)) . "\n" .
                            "👤 Customer: {$customerName}\n" .
                            "💰 Total: " . $order->getTotalAmount()->format() . "\n\n" .
                            "Would you like more details about this order?",
                    actions: ['show_order_details', 'track_shipment'],
                    confidence: 0.95,
                    requiresHumanHandoff: false,
                    data: [
                        'order_id' => $order->getId()->getValue(),
                        'order_number' => $orderNumber,
                        'status' => $status
                    ]
                );
            } else {
                return new ChatbotResponse(
                    message: "I couldn't find an order with number #{$orderNumber}. Please double-check the order number or contact our support team if you need assistance.",
                    actions: ['contact_support', 'search_orders'],
                    confidence: 0.8,
                    requiresHumanHandoff: false
                );
            }
        }
        
        // If customer is logged in, show recent orders
        if ($customer) {
            $recentOrders = $this->orderRepository->findRecentByCustomer($customer->getId(), 3);
            
            if (!empty($recentOrders)) {
                $ordersList = "";
                foreach ($recentOrders as $order) {
                    $ordersList .= "• #{$order->getOrderNumber()} - " . 
                                  ucfirst(str_replace('_', ' ', $order->getStatus()->value)) . 
                                  " - " . $order->getTotalAmount()->format() . "\n";
                }
                
                return new ChatbotResponse(
                    message: "Here are your recent orders:\n\n{$ordersList}\nWhich order would you like to check?",
                    actions: ['select_order'],
                    confidence: 0.9,
                    requiresHumanHandoff: false,
                    data: ['recent_orders' => array_map(fn($o) => $o->getOrderNumber(), $recentOrders)]
                );
            }
        }
        
        return new ChatbotResponse(
            message: "I don't see any recent orders. If you have an order number, please share it with me, or I can connect you with our support team.",
            actions: ['contact_support'],
            confidence: 0.7,
            requiresHumanHandoff: true
        );
    }

    /**
     * Handle pricing inquiries
     */
    private function handlePricingInquiry(array $entities, ?Customer $customer): ChatbotResponse
    {
        // Extract product or service from entities
        $productName = null;
        $priceRange = null;
        
        foreach ($entities as $entity) {
            if ($entity->getType() === 'product_name') {
                $productName = $entity->getValue();
            } elseif ($entity->getType() === 'price_range') {
                $priceRange = $entity->getValue();
            }
        }
        
        if ($productName) {
            // Search for products matching the name
            $products = $this->productRepository->searchByName($productName, 3);
            
            if (!empty($products)) {
                $productsList = "";
                foreach ($products as $product) {
                    $productsList .= "• {$product->getName()} - " . $product->getPrice()->format() . "\n";
                }
                
                return new ChatbotResponse(
                    message: "Here are the pricing options for '{$productName}':\n\n{$productsList}\nWould you like more details about any of these products?",
                    actions: ['view_product_details', 'request_quote'],
                    confidence: 0.9,
                    requiresHumanHandoff: false
                );
            }
        }
        
        return new ChatbotResponse(
            message: "I'd be happy to help you with pricing information! Could you tell me which specific product or service you're interested in? You can also browse our product catalog for detailed pricing.",
            actions: ['browse_products', 'request_custom_quote'],
            confidence: 0.8,
            requiresHumanHandoff: false,
            suggestedResponses: [
                "I'm interested in custom engraving",
                "What are your glass etching prices?",
                "I need a quote for metal plaques"
            ]
        );
    }

    /**
     * Handle product information queries
     */
    private function handleProductInquiry(array $entities): ChatbotResponse
    {
        return new ChatbotResponse(
            message: "I can help you learn about our products! We specialize in custom engraving and etching services for metals, glass, and award plaques. What specific information are you looking for?",
            actions: ['browse_products', 'view_categories'],
            confidence: 0.8,
            requiresHumanHandoff: false,
            suggestedResponses: [
                "What materials do you work with?",
                "Show me your product categories",
                "What's your turnaround time?"
            ]
        );
    }

    /**
     * Handle support requests
     */
    private function handleSupportRequest(array $entities, ?Customer $customer): ChatbotResponse
    {
        return new ChatbotResponse(
            message: "I'm here to help! I can assist with order status, pricing questions, product information, and general inquiries. For technical issues or complex problems, I can connect you with our support team. What do you need help with?",
            actions: ['contact_support', 'browse_faq'],
            confidence: 0.8,
            requiresHumanHandoff: false,
            suggestedResponses: [
                "I have a technical issue",
                "I need to change my order",
                "I have a billing question"
            ]
        );
    }

    /**
     * Handle appointment booking
     */
    private function handleAppointmentBooking(array $entities, ?Customer $customer): ChatbotResponse
    {
        return new ChatbotResponse(
            message: "I can help you schedule a consultation! Our team is available for product consultations and project discussions. Would you like to book an appointment?",
            actions: ['schedule_appointment', 'contact_sales'],
            confidence: 0.9,
            requiresHumanHandoff: false
        );
    }

    /**
     * Handle complaint handling
     */
    private function handleComplaintHandling(array $entities, ?Customer $customer): ChatbotResponse
    {
        return new ChatbotResponse(
            message: "I'm sorry to hear you're experiencing an issue. I want to make sure we resolve this for you quickly. Could you please describe the problem you're facing?",
            actions: ['file_complaint', 'contact_manager'],
            confidence: 0.9,
            requiresHumanHandoff: true
        );
    }

    /**
     * Handle general queries
     */
    private function handleGeneralQuery(array $entities, ?Customer $customer): ChatbotResponse
    {
        return new ChatbotResponse(
            message: "Hello! I'm here to help you with questions about our custom engraving and etching services. I can help you with:\n\n" .
                    "• Order status and tracking\n" .
                    "• Product information and pricing\n" .
                    "• Scheduling consultations\n" .
                    "• General support questions\n\n" .
                    "What can I help you with today?",
            actions: ['browse_products', 'check_order_status', 'contact_support'],
            confidence: 0.7,
            requiresHumanHandoff: false,
            suggestedResponses: [
                "Check my order status",
                "Get pricing information",
                "Schedule a consultation",
                "Browse products"
            ]
        );
    }

    /**
     * Initialize intent patterns for pattern matching
     */
    private function initializeIntentPatterns(): void
    {
        $this->intentPatterns = [
            'order_status' => [
                '/\b(order|status|track|tracking|where|delivery|shipped)\b.*\b(order|package|shipment)\b/i',
                '/\b(check|status|update).*\b(order|po|purchase)\b/i',
                '/\border\s*#?\s*[A-Z0-9\-]+/i'
            ],
            'pricing_inquiry' => [
                '/\b(price|cost|pricing|quote|estimate|how much|budget)\b/i',
                '/\b(what.*cost|how much.*cost|price.*for)\b/i'
            ],
            'product_information' => [
                '/\b(product|item|service|material|specification|detail)\b/i',
                '/\b(what.*do|tell me about|information about)\b/i'
            ],
            'support_request' => [
                '/\b(help|support|problem|issue|trouble|assistance)\b/i',
                '/\b(need help|having trouble|can\'t|won\'t|doesn\'t work)\b/i'
            ],
            'appointment_booking' => [
                '/\b(appointment|meeting|consultation|schedule|book|reserve)\b/i',
                '/\b(meet|visit|come in|available)\b/i'
            ],
            'complaint_handling' => [
                '/\b(complaint|complain|unhappy|dissatisfied|wrong|mistake|error)\b/i',
                '/\b(not happy|poor|bad|terrible|awful)\b/i'
            ]
        ];
    }

    /**
     * Initialize entity patterns for extraction
     */
    private function initializeEntityPatterns(): void
    {
        $this->entityPatterns = [
            'order_number' => [
                '/\border\s*#?\s*([A-Z0-9\-]{5,})/i',
                '/\b(po|purchase order)\s*#?\s*([A-Z0-9\-]{5,})/i'
            ],
            'product_name' => [
                '/\b(engraving|etching|plaque|trophy|award|medal|glass|metal|acrylic)\b/i'
            ],
            'price_range' => [
                '/\$(\d+(?:,\d{3})*(?:\.\d{2})?)/i',
                '/\b(\d+)\s*(?:dollar|bucks?)\b/i'
            ],
            'date_time' => [
                '/\b(\d{1,2}\/\d{1,2}\/\d{2,4})\b/',
                '/\b(today|tomorrow|yesterday|next week|last week)\b/i'
            ]
        ];
    }

    /**
     * Initialize response templates
     */
    private function initializeResponseTemplates(): void
    {
        $this->responseTemplates = [
            'greeting' => [
                "Hello! How can I help you today?",
                "Hi there! What can I assist you with?",
                "Welcome! I'm here to help with your questions."
            ],
            'clarification' => [
                "Could you please provide more details?",
                "I want to make sure I understand correctly. Could you clarify?",
                "Can you tell me more about what you're looking for?"
            ],
            'handoff' => [
                "Let me connect you with a human agent who can better assist you.",
                "I'll transfer you to our support team for personalized help.",
                "Our team will be able to help you with this specific request."
            ]
        ];
    }

    /**
     * Normalize query for processing
     */
    private function normalizeQuery(string $query): string
    {
        // Convert to lowercase and trim
        $normalized = strtolower(trim($query));
        
        // Remove extra whitespace
        $normalized = preg_replace('/\s+/', ' ', $normalized);
        
        return $normalized;
    }

    /**
     * Store conversation for learning and analytics
     */
    private function storeConversation(
        string $query,
        ChatbotIntent $intent,
        array $entities,
        ChatbotResponse $response,
        ?Customer $customer
    ): void {
        $conversation = [
            'query' => $query,
            'intent' => $intent->toArray(),
            'entities' => array_map(fn($e) => $e->toArray(), $entities),
            'response' => $response->toArray(),
            'customer_id' => $customer?->getId()->getValue(),
            'timestamp' => now()->toISOString()
        ];
        
        // Store in cache for analytics
        $cacheKey = 'chatbot_conversations_' . date('Y-m-d');
        $dailyConversations = Cache::get($cacheKey, []);
        $dailyConversations[] = $conversation;
        Cache::put($cacheKey, $dailyConversations, 86400); // 24 hours
    }
}