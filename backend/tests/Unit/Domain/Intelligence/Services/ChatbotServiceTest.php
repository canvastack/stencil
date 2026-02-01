<?php

namespace Tests\Unit\Domain\Intelligence\Services;

use Tests\TestCase;
use App\Domain\Intelligence\Services\ChatbotService;
use App\Domain\Intelligence\Services\MachineLearningService;
use App\Infrastructure\Persistence\Eloquent\Models\Customer;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;

class ChatbotServiceTest extends TestCase
{
    use RefreshDatabase;

    private ChatbotService $chatbotService;
    private MachineLearningService $mockMlService;
    private $mockOrderRepository;
    private $mockProductRepository;
    private $mockVendorRepository;

    protected function setUp(): void
    {
        parent::setUp();
        
        $this->mockMlService = Mockery::mock(MachineLearningService::class);
        $this->mockOrderRepository = Mockery::mock(\App\Domain\Order\Repositories\OrderRepositoryInterface::class);
        $this->mockProductRepository = Mockery::mock(\App\Domain\Product\Repositories\ProductRepositoryInterface::class);
        $this->mockVendorRepository = Mockery::mock(\App\Domain\Vendor\Repositories\VendorRepositoryInterface::class);
        
        $this->chatbotService = new ChatbotService(
            $this->mockMlService,
            $this->mockOrderRepository,
            $this->mockProductRepository,
            $this->mockVendorRepository
        );
    }

    public function test_it_processes_greeting_message()
    {
        // Arrange
        $message = "Hello";
        $customer = null;
        $context = [];

        // Mock ML service methods - recognizeIntent returns entities too
        $this->mockMlService->shouldReceive('recognizeIntent')
            ->twice() // Called in both analyzeIntent and extractEntities
            ->andReturn([
                'intent' => 'general_inquiry',
                'confidence' => 0.7,
                'entities' => [] // Empty entities for greeting
            ]);

        // Act
        $response = $this->chatbotService->processCustomerQuery($message, $customer, $context);

        // Assert
        $this->assertInstanceOf(\App\Domain\Intelligence\ValueObjects\ChatbotResponse::class, $response);
        $this->assertIsString($response->getMessage());
        $this->assertIsFloat($response->getConfidence());
        $this->assertIsArray($response->getActions());
    }

    public function test_it_gets_capabilities()
    {
        // Act
        $capabilities = $this->chatbotService->getCapabilities();

        // Assert
        $this->assertIsArray($capabilities);
        $this->assertArrayHasKey('intents', $capabilities);
        $this->assertArrayHasKey('entities', $capabilities);
        $this->assertArrayHasKey('languages', $capabilities);
        
        // Check structure
        $this->assertArrayHasKey('order_status', $capabilities['intents']);
        $this->assertArrayHasKey('pricing_inquiry', $capabilities['intents']);
        $this->assertArrayHasKey('product_information', $capabilities['intents']);
    }

    public function test_it_trains_with_conversation()
    {
        // Arrange
        $query = "Hello there";
        $expectedIntent = 'greeting';
        $expectedEntities = [];
        $correctResponse = 'Hello! How can I help you?';
        $customer = null;

        // Mock ML service method
        $this->mockMlService->shouldReceive('updateModel')
            ->once()
            ->with('chatbot_intent', Mockery::type('array'));

        // Act & Assert - should not throw exception
        $this->chatbotService->trainWithConversation(
            $query, 
            $expectedIntent, 
            $expectedEntities, 
            $correctResponse, 
            $customer
        );

        $this->assertTrue(true); // If we get here, the method executed successfully
    }

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }
}