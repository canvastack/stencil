<?php

namespace App\Http\Controllers\CustomerPortal;

use App\Application\CustomerQuote\Services\CustomerQuoteService;
use App\Application\CustomerQuote\Services\ApprovalService;
use App\Application\CustomerQuote\Services\NegotiationService;
use App\Services\CustomerQuoteAuditService;
use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerQuoteResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Customer Portal Controller for Quote Management
 * 
 * Handles both public (token-based) and authenticated customer interactions with quotes
 */
class QuoteController extends Controller
{
    public function __construct(
        private CustomerQuoteService $quoteService,
        private ApprovalService $approvalService,
        private NegotiationService $negotiationService,
        private CustomerQuoteAuditService $auditService
    ) {}

    /**
     * List all quotes for authenticated customer
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $customer = $request->user('sanctum');
            
            if (!$customer) {
                \Log::error('QuoteController::index - No customer authenticated');
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            \Log::info('QuoteController::index', [
                'customer_id' => $customer->id,
                'customer_email' => $customer->email,
                'customer_name' => $customer->name,
            ]);

            // Get all quotes for this customer
            $quotes = $this->quoteService->getCustomerQuotes($customer->id);

            \Log::info('QuoteController::index - Quotes found', [
                'count' => $quotes->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => CustomerQuoteResource::collection($quotes),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to list customer quotes', [
                'customer_id' => $customer->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quotes',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Show specific quote for authenticated customer
     * 
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        try {
            $customer = $request->user('sanctum');
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $quote = $this->quoteService->getByUuid($uuid);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found',
                ], 404);
            }

            // Verify quote belongs to this customer
            $quote->load('order');
            if ($quote->order->customer_id !== $customer->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to view this quote',
                ], 403);
            }

            // Mark as viewed
            $this->quoteService->markAsViewed($quote->uuid);
            
            // Log view action
            $this->auditService->logView($quote, 'customer', $customer->id);

            // Load additional relationships
            $quote->load([
                'vendorQuote',
                'documents',
            ]);

            return response()->json([
                'success' => true,
                'data' => new CustomerQuoteResource($quote),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to show quote', [
                'uuid' => $uuid,
                'customer_id' => $customer->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Accept quote (authenticated customer)
     * 
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function acceptAuthenticated(Request $request, string $uuid): JsonResponse
    {
        try {
            $customer = $request->user('sanctum');
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $validated = $request->validate([
                'terms_accepted' => 'required|boolean|accepted',
            ]);

            $quote = $this->quoteService->getByUuid($uuid);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found',
                ], 404);
            }

            // Verify quote belongs to this customer
            $quote->load('order');
            if ($quote->order->customer_id !== $customer->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to accept this quote',
                ], 403);
            }

            // Check if quote can be accepted
            if ($quote->status !== 'sent') {
                return response()->json([
                    'success' => false,
                    'message' => "Quote cannot be accepted. Current status: {$quote->status}",
                ], 400);
            }

            // Check if quote is expired
            if ($quote->valid_until && now()->isAfter($quote->valid_until)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This quote has expired',
                ], 410);
            }

            // Accept the quote
            $result = $this->quoteService->acceptQuote(
                quoteUuid: $quote->uuid,
                customerId: $customer->id,
                termsAccepted: $validated['terms_accepted']
            );
            
            // Log acceptance
            $this->auditService->logAcceptance(
                $result['quote'],
                $customer->id,
                $result['approval_method'],
                $result['approval_reason'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => $result['approval_method'] === 'auto' 
                    ? 'Quote accepted successfully' 
                    : 'Quote acceptance received and pending approval',
                'approval_method' => $result['approval_method'],
                'data' => new CustomerQuoteResource($result['quote']),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to accept quote (authenticated)', [
                'uuid' => $uuid,
                'customer_id' => $customer->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to accept quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit counter offer (authenticated customer)
     * 
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function counterOfferAuthenticated(Request $request, string $uuid): JsonResponse
    {
        try {
            $customer = $request->user('sanctum');
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $validated = $request->validate([
                'counter_amount' => 'required|integer|min:0',
                'notes' => 'required|string|min:20',
                'additional_requests' => 'nullable|string',
            ]);

            $quote = $this->quoteService->getByUuid($uuid);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found',
                ], 404);
            }

            // Verify quote belongs to this customer
            $quote->load('order');
            if ($quote->order->customer_id !== $customer->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to counter this quote',
                ], 403);
            }

            // Check if quote can be countered
            if (!in_array($quote->status, ['sent', 'countered'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Quote cannot be countered. Current status: {$quote->status}",
                ], 400);
            }

            // Check if quote is expired
            if ($quote->valid_until && now()->isAfter($quote->valid_until)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This quote has expired',
                ], 410);
            }

            // Submit counter offer
            $updatedQuote = $this->negotiationService->submitCounterOffer(
                quoteUuid: $quote->uuid,
                customerId: $customer->id,
                counterAmount: $validated['counter_amount'],
                reason: $validated['notes'],
                additionalRequests: $validated['additional_requests'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Counter offer submitted successfully',
                'data' => new CustomerQuoteResource($updatedQuote),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to submit counter offer (authenticated)', [
                'uuid' => $uuid,
                'customer_id' => $customer->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit counter offer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject quote (authenticated customer)
     * 
     * @param Request $request
     * @param string $uuid
     * @return JsonResponse
     */
    public function rejectAuthenticated(Request $request, string $uuid): JsonResponse
    {
        try {
            $customer = $request->user('sanctum');
            
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized',
                ], 401);
            }

            $validated = $request->validate([
                'reason' => 'required|string|min:10',
            ]);

            $quote = $this->quoteService->getByUuid($uuid);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found',
                ], 404);
            }

            // Verify quote belongs to this customer
            $quote->load('order');
            if ($quote->order->customer_id !== $customer->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthorized to reject this quote',
                ], 403);
            }

            // Check if quote can be rejected
            if (!in_array($quote->status, ['sent', 'countered'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Quote cannot be rejected. Current status: {$quote->status}",
                ], 400);
            }

            // Reject the quote
            $updatedQuote = $this->quoteService->rejectQuote(
                quoteUuid: $quote->uuid,
                customerId: $customer->id,
                reason: $validated['reason']
            );

            return response()->json([
                'success' => true,
                'message' => 'Quote rejected successfully',
                'data' => new CustomerQuoteResource($updatedQuote),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to reject quote (authenticated)', [
                'uuid' => $uuid,
                'customer_id' => $customer->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * View quote by token (public access)
     * 
     * @param string $token
     * @return JsonResponse
     */
    public function viewByToken(string $token): JsonResponse
    {
        try {
            // Validate token format (should be UUID)
            if (!Str::isUuid($token)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found or token is invalid',
                ], 404);
            }
            
            $quote = $this->quoteService->getByToken($token);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found or token is invalid',
                ], 404);
            }

            // Check if quote is expired
            if ($quote->status === 'expired') {
                return response()->json([
                    'success' => false,
                    'message' => 'This quote has expired',
                ], 410); // 410 Gone
            }

            // Load relationships before accessing them
            $quote->load('order.customer');

            // Mark as viewed
            $this->quoteService->markAsViewed($quote->uuid);
            
            // Log view action (customer_id might be null for guest views)
            $customerId = $quote->order?->customer_id;
            $this->auditService->logView($quote, 'customer', $customerId);

            // Load additional relationships
            $quote->load([
                'vendorQuote',
                'documents',
            ]);

            return response()->json([
                'success' => true,
                'data' => new CustomerQuoteResource($quote),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to view quote by token', [
                'token' => $token,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Accept quote (public access via token)
     * 
     * @param string $token
     * @param Request $request
     * @return JsonResponse
     */
    public function accept(string $token, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'terms_accepted' => 'required|boolean|accepted',
            ]);

            $quote = $this->quoteService->getByToken($token);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found or token is invalid',
                ], 404);
            }

            // Check if quote can be accepted
            if ($quote->status !== 'sent') {
                return response()->json([
                    'success' => false,
                    'message' => "Quote cannot be accepted. Current status: {$quote->status}",
                ], 400);
            }

            // Check if quote is expired
            if ($quote->valid_until && now()->isAfter($quote->valid_until)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This quote has expired',
                ], 410);
            }

            // Get customer ID from quote's order
            $quote->load('order');
            $customerId = $quote->order->customer_id;

            // Accept the quote (will trigger approval logic)
            $result = $this->quoteService->acceptQuote(
                quoteUuid: $quote->uuid,
                customerId: $customerId,
                termsAccepted: $validated['terms_accepted']
            );
            
            // Log acceptance
            $this->auditService->logAcceptance(
                $result['quote'],
                $customerId,
                $result['approval_method'],
                $result['approval_reason'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => $result['approval_method'] === 'auto' 
                    ? 'Quote accepted successfully' 
                    : 'Quote acceptance received and pending approval',
                'approval_method' => $result['approval_method'],
                'data' => new CustomerQuoteResource($result['quote']),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to accept quote', [
                'token' => $token,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to accept quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Submit counter offer (public access via token)
     * 
     * @param string $token
     * @param Request $request
     * @return JsonResponse
     */
    public function counterOffer(string $token, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'counter_amount' => 'required|integer|min:0',
                'notes' => 'required|string|min:20',
                'additional_requests' => 'nullable|string',
            ]);

            $quote = $this->quoteService->getByToken($token);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found or token is invalid',
                ], 404);
            }

            // Check if quote can be countered
            if (!in_array($quote->status, ['sent', 'countered'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Quote cannot be countered. Current status: {$quote->status}",
                ], 400);
            }

            // Check if quote is expired
            if ($quote->valid_until && now()->isAfter($quote->valid_until)) {
                return response()->json([
                    'success' => false,
                    'message' => 'This quote has expired',
                ], 410);
            }

            // Get customer ID from quote's order
            $quote->load('order');
            $customerId = $quote->order->customer_id;

            // Submit counter offer
            $updatedQuote = $this->negotiationService->submitCounterOffer(
                quoteUuid: $quote->uuid,
                customerId: $customerId,
                counterAmount: $validated['counter_amount'],
                reason: $validated['notes'],
                additionalRequests: $validated['additional_requests'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Counter offer submitted successfully',
                'data' => new CustomerQuoteResource($updatedQuote),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to submit counter offer', [
                'token' => $token,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to submit counter offer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject quote (public access via token)
     * 
     * @param string $token
     * @param Request $request
     * @return JsonResponse
     */
    public function reject(string $token, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|min:10',
            ]);

            $quote = $this->quoteService->getByToken($token);

            if (!$quote) {
                return response()->json([
                    'success' => false,
                    'message' => 'Quote not found or token is invalid',
                ], 404);
            }

            // Check if quote can be rejected
            if (!in_array($quote->status, ['sent', 'countered'])) {
                return response()->json([
                    'success' => false,
                    'message' => "Quote cannot be rejected. Current status: {$quote->status}",
                ], 400);
            }

            // Get customer ID from quote's order
            $quote->load('order');
            $customerId = $quote->order->customer_id;

            // Reject the quote
            $updatedQuote = $this->quoteService->rejectQuote(
                quoteUuid: $quote->uuid,
                customerId: $customerId,
                reason: $validated['reason']
            );

            return response()->json([
                'success' => true,
                'message' => 'Quote rejected successfully',
                'data' => new CustomerQuoteResource($updatedQuote),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to reject quote', [
                'token' => $token,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
