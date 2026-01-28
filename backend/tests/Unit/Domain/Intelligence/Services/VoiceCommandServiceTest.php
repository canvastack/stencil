<?php

namespace Tests\Unit\Domain\Intelligence\Services;

use Tests\TestCase;
use App\Domain\Intelligence\Services\VoiceCommandService;
use App\Domain\Intelligence\Services\MachineLearningService;
use App\Domain\Intelligence\ValueObjects\VoiceCommandResult;
use App\Domain\Intelligence\ValueObjects\VoicePattern;

class VoiceCommandServiceTest extends TestCase
{
    private VoiceCommandService $voiceCommandService;
    private MachineLearningService $mlService;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Use real ML service instead of mock - following development rules
        $this->mlService = new MachineLearningService();
        $this->voiceCommandService = new VoiceCommandService($this->mlService);
    }

    public function test_it_processes_navigation_command_successfully()
    {
        // Arrange
        $command = "go to dashboard";
        $userId = 1;
        $tenantId = null;
        $context = [];
        $userPreferences = [];

        // Act
        $result = $this->voiceCommandService->processCommand(
            $command,
            $userId,
            $tenantId,
            $context,
            $userPreferences
        );

        // Assert
        $this->assertInstanceOf(VoiceCommandResult::class, $result);
        $this->assertTrue($result->isSuccessful());
        $this->assertEquals('navigate', $result->getAction());
        $this->assertEquals('/admin', $result->getParameters()['route']);
        $this->assertGreaterThan(0.6, $result->getConfidence());
    }

    public function test_it_processes_search_command_successfully()
    {
        // Arrange
        $command = "search for customers";
        $userId = 1;

        // Act
        $result = $this->voiceCommandService->processCommand($command, $userId);

        // Assert
        $this->assertTrue($result->isSuccessful());
        $this->assertEquals('search', $result->getAction());
        $this->assertEquals('customers', $result->getParameters()['query']);
    }

    public function test_it_processes_create_command_successfully()
    {
        // Arrange
        $command = "create order";
        $userId = 1;

        // Act - No mock needed, using real ML service
        $result = $this->voiceCommandService->processCommand($command, $userId);

        // Assert
        $this->assertTrue($result->isSuccessful());
        $this->assertEquals('create', $result->getAction());
        $this->assertEquals('order', $result->getParameters()['entity']);
    }

    public function test_it_handles_unrecognized_command()
    {
        // Arrange
        $command = "xyz invalid command";
        $userId = 1;

        // Act - Using real ML service which will return low confidence for unknown commands
        $result = $this->voiceCommandService->processCommand($command, $userId);

        // Assert
        $this->assertFalse($result->isSuccessful());
        $this->assertEquals('unknown', $result->getAction());
        $this->assertIsArray($result->getSuggestions());
    }

    public function test_it_gets_available_commands()
    {
        // Act
        $commands = $this->voiceCommandService->getAvailableCommands(1);

        // Assert
        $this->assertIsArray($commands);
        $this->assertArrayHasKey('navigation', $commands);
        $this->assertArrayHasKey('search', $commands);
        $this->assertArrayHasKey('actions', $commands);
        $this->assertArrayHasKey('information', $commands);
    }

    public function test_it_gets_command_categories()
    {
        // Act
        $categories = $this->voiceCommandService->getCommandCategories();

        // Assert
        $this->assertIsArray($categories);
        $this->assertArrayHasKey('navigation', $categories);
        $this->assertArrayHasKey('search', $categories);
        $this->assertArrayHasKey('actions', $categories);
        $this->assertArrayHasKey('information', $categories);
        
        // Check structure
        $this->assertArrayHasKey('name', $categories['navigation']);
        $this->assertArrayHasKey('description', $categories['navigation']);
        $this->assertArrayHasKey('icon', $categories['navigation']);
    }

    public function test_it_trains_user_pattern()
    {
        // Arrange
        $userId = 1;
        $command = "show me orders";
        $intendedAction = "navigate";
        $parameters = ['route' => '/admin/orders'];

        // Act
        $pattern = $this->voiceCommandService->trainUserPattern(
            $userId,
            $command,
            $intendedAction,
            $parameters
        );

        // Assert
        $this->assertInstanceOf(VoicePattern::class, $pattern);
        $this->assertEquals($userId, $pattern->getUserId());
        $this->assertEquals($intendedAction, $pattern->getAction());
        $this->assertEquals($parameters, $pattern->getParameters());
        $this->assertEquals(1.0, $pattern->getConfidence());
    }

    public function test_it_normalizes_command_properly()
    {
        // Test through a command that would be normalized
        $command = "  GO TO   DASHBOARD!!!  ";
        $result = $this->voiceCommandService->processCommand($command, 1);

        // Should still work despite extra spaces and punctuation
        $this->assertTrue($result->isSuccessful());
        $this->assertEquals('navigate', $result->getAction());
    }

    public function test_ml_service_recognizes_intent_correctly()
    {
        // Test the ML service directly to ensure it works properly
        $result = $this->mlService->recognizeIntent("create new order");
        
        $this->assertIsArray($result);
        $this->assertArrayHasKey('intent', $result);
        $this->assertArrayHasKey('confidence', $result);
        $this->assertEquals('create', $result['intent']);
        $this->assertGreaterThan(0.5, $result['confidence']);
    }

    public function test_ml_service_handles_low_confidence_commands()
    {
        // Test with a command that should have low confidence
        $result = $this->mlService->recognizeIntent("xyz random gibberish");
        
        $this->assertIsArray($result);
        $this->assertEquals('unknown', $result['intent']);
        $this->assertLessThan(0.5, $result['confidence']);
    }
}