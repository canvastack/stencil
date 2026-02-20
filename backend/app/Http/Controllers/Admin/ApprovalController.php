<?php

namespace App\Http\Controllers\Admin;

use App\Application\CustomerQuote\Services\ApprovalService;
use App\Http\Controllers\Controller;
use App\Http\Resources\CustomerQuoteResource;
use App\Http\Resources\ApprovalSettingsResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Admin Controller for Quote Approval Management
 * 
 * Handles approval workflow for customer quotes
 */
class ApprovalController extends Controller
{
    public function __construct(
        private ApprovalService $approvalService
    ) {}

    /**
     * Get pending approvals
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;
            
            $pendingQuotes = $this->approvalService->getPendingApprovals($tenantId);

            return response()->json([
                'success' => true,
                'data' => CustomerQuoteResource::collection($pendingQuotes),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get pending approvals', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve pending approvals',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Approve quote
     * 
     * @param string $quoteUuid
     * @param Request $request
     * @return JsonResponse
     */
    public function approve(string $quoteUuid, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'approval_notes' => 'nullable|string',
            ]);

            $userId = $request->user()->id;

            $quote = $this->approvalService->approveQuote(
                quoteUuid: $quoteUuid,
                approvedBy: $userId,
                notes: $validated['approval_notes'] ?? null
            );

            return response()->json([
                'success' => true,
                'message' => 'Quote approved successfully',
                'data' => new CustomerQuoteResource($quote),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to approve quote', [
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to approve quote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Reject quote
     * 
     * @param string $quoteUuid
     * @param Request $request
     * @return JsonResponse
     */
    public function reject(string $quoteUuid, Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'rejection_reason' => 'required|string|min:10',
            ]);

            $userId = $request->user()->id;

            $quote = $this->approvalService->rejectQuote(
                quoteUuid: $quoteUuid,
                rejectedBy: $userId,
                reason: $validated['rejection_reason']
            );

            return response()->json([
                'success' => true,
                'message' => 'Quote rejected successfully',
                'data' => new CustomerQuoteResource($quote),
            ]);
        } catch (\DomainException $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Failed to reject quote', [
                'quote_uuid' => $quoteUuid,
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
     * Get approval settings
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function getSettings(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;
            
            $settings = $this->approvalService->getSettings($tenantId);

            return response()->json([
                'success' => true,
                'data' => new ApprovalSettingsResource($settings),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get approval settings', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve approval settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update approval settings
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function updateSettings(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'auto_approval_enabled' => 'required|boolean',
                'auto_approval_threshold' => 'required|integer|min:0',
                'require_email_verification' => 'required|boolean',
                'min_successful_orders' => 'required|integer|min:0',
                'min_payment_success_rate' => 'required|numeric|min:0|max:100',
            ]);

            $tenantId = $request->user()->tenant_id;

            $settings = $this->approvalService->updateSettings($tenantId, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Approval settings updated successfully',
                'data' => new ApprovalSettingsResource($settings),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to update approval settings', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update approval settings',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
