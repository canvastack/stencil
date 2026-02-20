<?php

namespace App\Http\Controllers\Admin;

use App\Application\CustomerQuote\Services\NegotiationService;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin Controller for Quote Negotiation Management
 * 
 * Handles counter offers and negotiation rounds
 */
class NegotiationController extends Controller
{
    public function __construct(
        private NegotiationService $negotiationService
    ) {}

    /**
     * Accept customer counter offer
     * 
     * @param string $quoteUuid
     * @param Request $request
     * @return JsonResponse
     */
    public function acceptCounterOffer(string $quoteUuid, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'notes' => 'nullable|string|max:1000',
            ]);

            $adminId = $request->user()->id;
            $notes = $validated['notes'] ?? null;

            $quote = $this->negotiationService->acceptCounterOffer($quoteUuid, $adminId, $notes);

            return response()->json([
                'success' => true,
                'message' => 'Counter offer accepted successfully',
                'data' => $quote,
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to accept counter offer', [
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to accept counter offer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject customer counter offer
     * 
     * @param string $quoteUuid
     * @param Request $request
     * @return JsonResponse
     */
    public function rejectCounterOffer(string $quoteUuid, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'reason' => 'required|string|min:20|max:1000',
            ]);

            $adminId = $request->user()->id;
            $reason = $validated['reason'];

            $quote = $this->negotiationService->rejectCounterOffer($quoteUuid, $adminId, $reason);

            return response()->json([
                'success' => true,
                'message' => 'Counter offer rejected',
                'data' => $quote,
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to reject counter offer', [
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to reject counter offer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Send admin counter offer to customer
     * 
     * @param string $quoteUuid
     * @param Request $request
     * @return JsonResponse
     */
    public function sendCounterOffer(string $quoteUuid, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'counter_amount' => 'required|integer|min:0',
                'explanation' => 'required|string|min:20|max:1000',
            ]);

            $adminId = $request->user()->id;
            $counterAmount = $validated['counter_amount'];
            $explanation = $validated['explanation'];

            $quote = $this->negotiationService->sendAdminCounterOffer(
                $quoteUuid,
                $adminId,
                $counterAmount,
                $explanation
            );

            return response()->json([
                'success' => true,
                'message' => 'Counter offer sent to customer',
                'data' => $quote,
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Failed to send admin counter offer', [
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to send counter offer',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
