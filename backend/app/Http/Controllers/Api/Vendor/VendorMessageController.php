<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Application\Vendor\Commands\SendQuoteMessageCommand;
use App\Application\Vendor\Queries\GetQuoteMessagesQuery;
use App\Application\Vendor\UseCases\SendQuoteMessageUseCase;
use App\Application\Vendor\UseCases\GetQuoteMessagesUseCase;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\SendMessageRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use InvalidArgumentException;

/**
 * VendorMessageController
 * 
 * Handles vendor quote message endpoints.
 * 
 * Endpoints:
 * - GET /api/v1/vendor/quotes/{uuid}/messages - List quote messages
 * - POST /api/v1/vendor/quotes/{uuid}/messages - Send message
 * 
 * Requirements: 13.1, 13.2, 13.3, 13.7, 13.8
 */
class VendorMessageController extends Controller
{
    public function __construct(
        private readonly GetQuoteMessagesUseCase $getQuoteMessagesUseCase,
        private readonly SendQuoteMessageUseCase $sendQuoteMessageUseCase
    ) {}

    /**
     * List quote messages with pagination
     * 
     * GET /api/v1/vendor/quotes/{uuid}/messages
     * 
     * Query Parameters:
     * - page: Page number (default: 1)
     * - per_page: Items per page (default: 50)
     * 
     * Requirements: 13.1, 13.2, 13.10
     * 
     * @param Request $request
     * @param string $uuid Quote UUID
     * @return JsonResponse
     */
    public function index(Request $request, string $uuid): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $tenantId = $request->tenant_id;

            $query = new GetQuoteMessagesQuery(
                quoteUuid: $uuid,
                vendorId: $vendor->id,
                tenantId: $tenantId,
                page: (int) $request->query('page', 1),
                perPage: (int) $request->query('per_page', 50)
            );

            $result = $this->getQuoteMessagesUseCase->execute($query);

            return response()->json([
                'message' => 'Messages retrieved successfully',
                'data' => $result['data'],
                'pagination' => $result['pagination'],
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Quote not found',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            Log::error('Get quote messages error', [
                'vendor_id' => $request->vendor?->id,
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while retrieving messages',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Send message to quote thread
     * 
     * POST /api/v1/vendor/quotes/{uuid}/messages
     * 
     * Request Body:
     * - message: string (required, max: 5000)
     * - attachments: file[] (optional, max: 5 files, each max 10MB)
     * 
     * Requirements: 13.1, 13.2, 13.3, 13.7, 13.8
     * 
     * @param SendMessageRequest $request
     * @param string $uuid Quote UUID
     * @return JsonResponse
     */
    public function store(SendMessageRequest $request, string $uuid): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $tenantId = $request->tenant_id;

            // Handle file uploads
            $attachments = [];
            if ($request->hasFile('attachments')) {
                foreach ($request->file('attachments') as $file) {
                    try {
                        // Generate secure filename
                        $filename = \Ramsey\Uuid\Uuid::uuid4()->toString() . '_' . $file->getClientOriginalName();
                        
                        // Store file in tenant-scoped directory
                        $path = $file->storeAs(
                            "tenant_{$tenantId}/quote_messages",
                            $filename,
                            'local'
                        );

                        // Add attachment metadata
                        $attachments[] = [
                            'filename' => $file->getClientOriginalName(),
                            'path' => $path,
                            'url' => Storage::url($path),
                            'size' => $file->getSize(),
                            'mime_type' => $file->getMimeType(),
                        ];
                    } catch (\Exception $e) {
                        Log::error('File upload error', [
                            'vendor_id' => $vendor->id,
                            'quote_uuid' => $uuid,
                            'filename' => $file->getClientOriginalName(),
                            'error' => $e->getMessage(),
                        ]);
                        
                        // Continue with other files, don't fail the entire request
                        continue;
                    }
                }
            }

            $command = new SendQuoteMessageCommand(
                quoteUuid: $uuid,
                vendorId: $vendor->id,
                tenantId: $tenantId,
                message: $request->input('message'),
                attachments: $attachments
            );

            $result = $this->sendQuoteMessageUseCase->execute($command);

            return response()->json([
                'message' => 'Message sent successfully',
                'data' => $result,
            ], 201);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Send message error', [
                'vendor_id' => $request->vendor?->id,
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while sending message',
                'error' => 'Internal server error',
            ], 500);
        }
    }
}
