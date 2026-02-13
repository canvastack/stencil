<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Application\Vendor\Queries\GetVendorQuotesQuery;
use App\Application\Vendor\Queries\GetQuoteDetailQuery;
use App\Application\Vendor\UseCases\GetVendorQuotesUseCase;
use App\Application\Vendor\UseCases\GetQuoteDetailUseCase;
use App\Application\Quote\Commands\AcceptQuoteCommand;
use App\Application\Quote\Commands\RejectQuoteCommand;
use App\Application\Quote\Commands\CounterOfferQuoteCommand;
use App\Application\Quote\UseCases\AcceptQuoteUseCase;
use App\Application\Quote\UseCases\RejectQuoteUseCase;
use App\Application\Quote\UseCases\CounterOfferQuoteUseCase;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\AcceptQuoteRequest;
use App\Http\Requests\Vendor\RejectQuoteRequest;
use App\Http\Requests\Vendor\CounterOfferRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * VendorQuoteController
 * 
 * Handles vendor quote management endpoints.
 * 
 * Endpoints:
 * - GET /api/v1/vendor/quotes - List vendor quotes with filtering and pagination
 * - GET /api/v1/vendor/quotes/{uuid} - Get quote detail
 * - POST /api/v1/vendor/quotes/{uuid}/accept - Accept quote
 * - POST /api/v1/vendor/quotes/{uuid}/reject - Reject quote
 * - POST /api/v1/vendor/quotes/{uuid}/counter-offer - Submit counter offer
 * 
 * Requirements: 4.1, 4.2, 4.3, 5.1, 6.2, 6.5, 6.8, 11.2, 11.3, 11.4
 */
class VendorQuoteController extends Controller
{
    public function __construct(
        private readonly GetVendorQuotesUseCase $getVendorQuotesUseCase,
        private readonly GetQuoteDetailUseCase $getQuoteDetailUseCase,
        private readonly AcceptQuoteUseCase $acceptQuoteUseCase,
        private readonly RejectQuoteUseCase $rejectQuoteUseCase,
        private readonly CounterOfferQuoteUseCase $counterOfferQuoteUseCase
    ) {}

    /**
     * List vendor quotes with filtering and pagination
     * 
     * GET /api/v1/vendor/quotes
     * 
     * Query Parameters:
     * - status: Filter by quote status (optional)
     * - page: Page number (default: 1)
     * - per_page: Items per page (default: 15)
     * 
     * Requirements: 4.1, 4.2, 4.3, 11.2
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $tenantId = $request->tenant_id;

            $query = new GetVendorQuotesQuery(
                vendorId: $vendor->id,
                tenantId: $tenantId,
                status: $request->query('status'),
                page: (int) $request->query('page', 1),
                perPage: (int) $request->query('per_page', 15)
            );

            $result = $this->getVendorQuotesUseCase->execute($query);

            return response()->json([
                'success' => true,
                'message' => 'Quotes retrieved successfully',
                'data' => [
                    'quotes' => $result['data'],
                    'pagination' => $result['pagination'],
                    'statistics' => $result['statistics'] ?? [
                        'total_quotes' => $result['pagination']['total'] ?? 0,
                        'pending_quotes' => 0,
                        'accepted_quotes' => 0,
                        'rejected_quotes' => 0,
                        'countered_quotes' => 0,
                        'expired_quotes' => 0,
                        'draft_quotes' => 0,
                        'acceptance_rate' => 0,
                        'rejection_rate' => 0,
                        'counter_rate' => 0,
                        'average_response_time_hours' => 0,
                        'median_response_time_hours' => 0,
                        'fastest_response_time_hours' => 0,
                        'slowest_response_time_hours' => 0,
                        'quotes_this_week' => 0,
                        'quotes_this_month' => 0,
                        'quotes_expiring_soon' => 0,
                        'total_quote_value' => 0,
                        'accepted_quote_value' => 0,
                        'average_quote_value' => 0,
                    ],
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Get vendor quotes error', [
                'vendor_id' => $request->vendor?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while retrieving quotes',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get quote detail
     * 
     * GET /api/v1/vendor/quotes/{uuid}
     * 
     * Requirements: 5.1, 11.4
     * 
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $tenantId = $request->tenant_id;

            $query = new GetQuoteDetailQuery(
                quoteUuid: $uuid,
                vendorId: $vendor->id,
                tenantId: $tenantId
            );

            $result = $this->getQuoteDetailUseCase->execute($query);

            return response()->json([
                'success' => true,
                'message' => 'Quote detail retrieved successfully',
                'data' => $result,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Quote not found',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            Log::error('Get quote detail error', [
                'vendor_id' => $request->vendor?->id,
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while retrieving quote detail',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Accept quote
     * 
     * POST /api/v1/vendor/quotes/{uuid}/accept
     * 
     * Request Body:
     * - estimated_delivery_days: integer (required, min: 1)
     * - notes: string (optional, max: 1000)
     * 
     * Requirements: 6.2, 6.3, 6.4, 11.4
     * 
     * @param AcceptQuoteRequest $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function accept(AcceptQuoteRequest $request, string $uuid): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $vendorUser = $request->vendor_user;
            $tenantId = $request->tenant_id;

            $command = new AcceptQuoteCommand(
                quoteUuid: $uuid,
                vendorId: $vendor->id,
                tenantId: $tenantId,
                estimatedDeliveryDays: $request->input('estimated_delivery_days'),
                notes: $request->input('notes'),
                userId: $vendorUser->id,
                ipAddress: $request->ip(),
                userAgent: $request->userAgent()
            );

            $result = $this->acceptQuoteUseCase->execute($command);

            return response()->json([
                'success' => true,
                'message' => 'Quote accepted successfully',
                'data' => $result,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => 'Cannot accept quote',
                'error' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Accept quote error', [
                'vendor_id' => $request->vendor?->id,
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while accepting quote',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Reject quote
     * 
     * POST /api/v1/vendor/quotes/{uuid}/reject
     * 
     * Request Body:
     * - rejection_reason: string (required, max: 500)
     * 
     * Requirements: 6.5, 6.6, 6.7, 11.4
     * 
     * @param RejectQuoteRequest $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function reject(RejectQuoteRequest $request, string $uuid): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $vendorUser = $request->vendor_user;
            $tenantId = $request->tenant_id;

            $command = new RejectQuoteCommand(
                quoteUuid: $uuid,
                vendorId: $vendor->id,
                tenantId: $tenantId,
                rejectionReason: $request->input('rejection_reason'),
                userId: $vendorUser->id,
                ipAddress: $request->ip(),
                userAgent: $request->userAgent()
            );

            $result = $this->rejectQuoteUseCase->execute($command);

            return response()->json([
                'success' => true,
                'message' => 'Quote rejected successfully',
                'data' => $result,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => 'Cannot reject quote',
                'error' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Reject quote error', [
                'vendor_id' => $request->vendor?->id,
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while rejecting quote',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Submit counter offer
     * 
     * POST /api/v1/vendor/quotes/{uuid}/counter-offer
     * 
     * Request Body:
     * - items: array (required, min: 1)
     *   - product_id: string (required)
     *   - counter_unit_price: numeric (required, min: 0.01)
     *   - notes: string (optional, max: 500)
     * - notes: string (optional, max: 1000)
     * - estimated_delivery_days: integer (optional, min: 1)
     * 
     * Requirements: 6.8, 6.9, 6.10, 11.4
     * 
     * @param CounterOfferRequest $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function counterOffer(CounterOfferRequest $request, string $uuid): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $vendorUser = $request->vendor_user;
            $tenantId = $request->tenant_id;

            $command = new CounterOfferQuoteCommand(
                quoteUuid: $uuid,
                vendorId: $vendor->id,
                tenantId: $tenantId,
                items: $request->input('items'),
                notes: $request->input('notes'),
                estimatedDeliveryDays: $request->input('estimated_delivery_days'),
                userId: $vendorUser->id,
                ipAddress: $request->ip(),
                userAgent: $request->userAgent()
            );

            $result = $this->counterOfferQuoteUseCase->execute($command);

            return response()->json([
                'success' => true,
                'message' => 'Counter offer submitted successfully',
                'data' => $result,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\DomainException $e) {
            return response()->json([
                'message' => 'Cannot submit counter offer',
                'error' => $e->getMessage(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Counter offer error', [
                'vendor_id' => $request->vendor?->id,
                'quote_uuid' => $uuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while submitting counter offer',
                'error' => 'Internal server error',
            ], 500);
        }
    }
}
