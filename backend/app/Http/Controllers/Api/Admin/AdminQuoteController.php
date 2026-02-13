<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Application\Quote\Commands\ExtendQuoteExpirationCommand;
use App\Application\Quote\UseCases\ExtendQuoteExpirationUseCase;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ExtendQuoteExpirationRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Admin Quote Controller
 * 
 * Handles admin operations for quote management including extending expiration dates.
 * 
 * Requirements: 10.8
 */
class AdminQuoteController extends Controller
{
    public function __construct(
        private readonly ExtendQuoteExpirationUseCase $extendQuoteExpirationUseCase
    ) {
    }

    /**
     * Extend quote expiration date
     * 
     * POST /api/v1/admin/quotes/{quoteUuid}/extend-expiration
     * 
     * Allows admins to extend the expiration date of quotes that are expired
     * or near expiration. Sends notification to the vendor.
     * 
     * Requirements: 10.8
     * 
     * @param ExtendQuoteExpirationRequest $request
     * @param string $quoteUuid
     * @return JsonResponse
     */
    public function extendExpiration(ExtendQuoteExpirationRequest $request, string $quoteUuid): JsonResponse
    {
        try {
            // Get tenant ID from request (set by TenantContextMiddleware or from authenticated user)
            $tenantId = $request->get('tenant_id') ?? $request->user()->tenant_id ?? null;
            if (!$tenantId) {
                return response()->json([
                    'message' => 'Tenant context not found',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 400);
            }

            // Get admin user ID from authenticated user
            $adminUserId = $request->user()->id ?? null;
            if (!$adminUserId) {
                return response()->json([
                    'message' => 'Admin user not authenticated',
                    'error' => 'ADMIN_NOT_AUTHENTICATED'
                ], 401);
            }

            // Get validated data
            $validated = $request->validated();
            
            // Parse new expiration date
            $newExpiresAt = new \DateTimeImmutable($validated['expires_at']);

            // Create command
            $command = new ExtendQuoteExpirationCommand(
                quoteUuid: $quoteUuid,
                tenantId: $tenantId,
                newExpiresAt: $newExpiresAt,
                userId: $adminUserId
            );

            // Execute use case
            $this->extendQuoteExpirationUseCase->execute($command);

            Log::info('Quote expiration extended successfully', [
                'quote_uuid' => $quoteUuid,
                'tenant_id' => $tenantId,
                'admin_user_id' => $adminUserId,
                'new_expires_at' => $newExpiresAt->format('Y-m-d H:i:s'),
            ]);

            return response()->json([
                'message' => 'Quote expiration extended successfully',
                'data' => [
                    'quote_uuid' => $quoteUuid,
                    'new_expires_at' => $newExpiresAt->format('Y-m-d\TH:i:s\Z'),
                    'extended_by' => $adminUserId,
                ]
            ], 200);

        } catch (InvalidArgumentException $e) {
            Log::warning('Failed to extend quote expiration', [
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'VALIDATION_ERROR'
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error extending quote expiration', [
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to extend quote expiration',
                'error' => 'SERVER_ERROR'
            ], 500);
        }
    }
}

