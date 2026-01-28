<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Intelligence\Services\VoiceCommandService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Voice Command Controller
 * 
 * Handles voice command processing for the AI-powered voice interface.
 * Processes natural language commands and returns structured actions.
 */
class VoiceCommandController extends Controller
{
    public function __construct(
        private VoiceCommandService $voiceCommandService
    ) {}

    /**
     * Process a voice command
     */
    public function processCommand(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'command' => 'required|string|max:500',
            'context' => 'sometimes|array',
            'user_preferences' => 'sometimes|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid command format',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $command = $request->input('command');
            $context = $request->input('context', []);
            $userPreferences = $request->input('user_preferences', []);

            // Process the voice command
            $result = $this->voiceCommandService->processCommand(
                command: $command,
                userId: auth()->id(),
                tenantId: auth()->user()->tenant_id,
                context: $context,
                userPreferences: $userPreferences
            );

            if ($result->isSuccessful()) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'action' => $result->getAction(),
                        'parameters' => $result->getParameters(),
                        'confidence' => $result->getConfidence(),
                        'response' => $result->getResponse(),
                        'suggestions' => $result->getSuggestions()
                    ]
                ]);
            } else {
                return response()->json([
                    'success' => false,
                    'message' => 'Command not recognized',
                    'data' => [
                        'suggestions' => $result->getSuggestions(),
                        'confidence' => $result->getConfidence()
                    ]
                ], 422);
            }
        } catch (\Exception $e) {
            \Log::error('Voice command processing failed', [
                'command' => $command ?? null,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to process voice command',
                'error' => app()->environment('local') ? $e->getMessage() : 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get available voice commands for help
     */
    public function getAvailableCommands(): JsonResponse
    {
        try {
            $commands = $this->voiceCommandService->getAvailableCommands(
                userId: auth()->id(),
                tenantId: auth()->user()->tenant_id
            );

            return response()->json([
                'success' => true,
                'data' => [
                    'commands' => $commands,
                    'categories' => $this->voiceCommandService->getCommandCategories()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available commands'
            ], 500);
        }
    }

    /**
     * Train voice recognition with user-specific patterns
     */
    public function trainVoicePattern(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'command' => 'required|string|max:500',
            'intended_action' => 'required|string|max:100',
            'parameters' => 'sometimes|array'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid training data',
                'errors' => $validator->errors()
            ], 400);
        }

        try {
            $result = $this->voiceCommandService->trainUserPattern(
                userId: auth()->id(),
                command: $request->input('command'),
                intendedAction: $request->input('intended_action'),
                parameters: $request->input('parameters', [])
            );

            return response()->json([
                'success' => true,
                'message' => 'Voice pattern trained successfully',
                'data' => [
                    'pattern_id' => $result->getPatternId(),
                    'confidence_improvement' => $result->getConfidenceImprovement()
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to train voice pattern'
            ], 500);
        }
    }
}