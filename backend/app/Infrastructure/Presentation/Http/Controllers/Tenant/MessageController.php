<?php

declare(strict_types=1);

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Domain\Quote\Services\MessageService;
use App\Domain\Quote\Repositories\QuoteRepositoryInterface;
use App\Infrastructure\Presentation\Http\Resources\MessageResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

/**
 * Message Controller
 * 
 * Handles HTTP requests for quote message operations.
 * Provides endpoints for viewing, sending, and managing messages
 * in quote communication threads.
 * 
 * Endpoints:
 * - GET /api/quotes/{uuid}/messages - List messages for a quote
 * - POST /api/quotes/{uuid}/messages - Send a new message
 * - POST /api/quotes/{uuid}/messages/{messageUuid}/read - Mark message as read
 * 
 * Requirements: 9.2, 9.3, 9.4 (Communication Center)
 */
class MessageController extends Controller
{
    public function __construct(
        private MessageService $messageService,
        private QuoteRepositoryInterface $quoteRepository
    ) {}

    /**
     * Get messages for a quote thread
     * 
     * GET /api/quotes/{uuid}/messages
     * 
     * @param string $uuid Quote UUID
     * @param Request $request
     * @return JsonResponse
     */
    public function index(string $uuid, Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;
            
            // Find quote by UUID
            $quote = $this->quoteRepository->findByUuid($uuid, $tenantId);
            
            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found'
                ], 404);
            }

            // Get messages for quote
            $messages = $this->messageService->getQuoteMessages(
                $quote->getId(),
                $tenantId
            );

            return response()->json([
                'success' => true,
                'data' => MessageResource::collection($messages),
                'meta' => [
                    'total' => count($messages),
                    'unread_count' => $this->messageService->getUnreadCount(
                        $quote->getId(),
                        auth()->id(),
                        $tenantId
                    )
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to fetch messages', [
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch messages'
            ], 500);
        }
    }

    /**
     * Send a new message in a quote thread
     * 
     * POST /api/quotes/{uuid}/messages
     * 
     * @param string $uuid Quote UUID
     * @param Request $request
     * @return JsonResponse
     */
    public function store(string $uuid, Request $request): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'message' => 'required|string|max:10000',
                'attachments' => 'nullable|array|max:5',
                'attachments.*' => 'file|max:10240' // 10MB max per file
            ]);

            $tenantId = auth()->user()->tenant_id;
            $senderId = auth()->id();

            // Find quote by UUID
            $quote = $this->quoteRepository->findByUuid($uuid, $tenantId);
            
            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found'
                ], 404);
            }

            // Get uploaded files
            $uploadedFiles = $request->hasFile('attachments') 
                ? $request->file('attachments') 
                : [];

            // Send message
            $message = $this->messageService->sendMessage(
                tenantId: $tenantId,
                quoteId: $quote->getId(),
                senderId: $senderId,
                messageContent: $validated['message'],
                uploadedFiles: $uploadedFiles
            );

            return response()->json([
                'success' => true,
                'data' => new MessageResource($message),
                'message' => 'Message sent successfully'
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'errors' => $e->errors(),
                'message' => 'Validation failed'
            ], 422);

        } catch (\InvalidArgumentException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Failed to send message', [
                'quote_uuid' => $uuid,
                'sender_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send message'
            ], 500);
        }
    }

    /**
     * Mark a message as read
     * 
     * POST /api/quotes/{uuid}/messages/{messageUuid}/read
     * 
     * @param string $uuid Quote UUID
     * @param string $messageUuid Message UUID
     * @param Request $request
     * @return JsonResponse
     */
    public function markAsRead(string $uuid, string $messageUuid, Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;

            // Verify quote exists
            $quote = $this->quoteRepository->findByUuid($uuid, $tenantId);
            
            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found'
                ], 404);
            }

            // Mark message as read
            $success = $this->messageService->markMessageAsRead($messageUuid, $tenantId);

            if (!$success) {
                return response()->json([
                    'success' => false,
                    'message' => 'Message not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Message marked as read'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to mark message as read', [
                'quote_uuid' => $uuid,
                'message_uuid' => $messageUuid,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark message as read'
            ], 500);
        }
    }

    /**
     * Mark all messages in a quote as read
     * 
     * POST /api/quotes/{uuid}/messages/read-all
     * 
     * @param string $uuid Quote UUID
     * @param Request $request
     * @return JsonResponse
     */
    public function markAllAsRead(string $uuid, Request $request): JsonResponse
    {
        try {
            $tenantId = auth()->user()->tenant_id;
            $userId = auth()->id();

            // Find quote by UUID
            $quote = $this->quoteRepository->findByUuid($uuid, $tenantId);
            
            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found'
                ], 404);
            }

            // Mark all messages as read
            $count = $this->messageService->markAllMessagesAsRead(
                $quote->getId(),
                $userId,
                $tenantId
            );

            return response()->json([
                'success' => true,
                'message' => "Marked {$count} messages as read",
                'data' => [
                    'count' => $count
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to mark all messages as read', [
                'quote_uuid' => $uuid,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to mark messages as read'
            ], 500);
        }
    }
}

