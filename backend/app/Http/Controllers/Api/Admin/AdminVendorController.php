<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Admin;

use App\Application\Vendor\Commands\OnboardVendorCommand;
use App\Application\Vendor\Commands\ResendWelcomeEmailCommand;
use App\Application\Vendor\UseCases\OnboardVendorUseCase;
use App\Application\Vendor\UseCases\ResendWelcomeEmailUseCase;
use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Admin Vendor Controller
 * 
 * Handles admin operations for vendor management including onboarding.
 */
class AdminVendorController extends Controller
{
    public function __construct(
        private readonly OnboardVendorUseCase $onboardVendorUseCase,
        private readonly ResendWelcomeEmailUseCase $resendWelcomeEmailUseCase
    ) {
    }

    /**
     * Enable portal access for a vendor (trigger onboarding)
     * 
     * POST /api/v1/admin/vendors/{vendorId}/enable-portal-access
     * 
     * @param Request $request
     * @param string $vendorId
     * @return JsonResponse
     */
    public function enablePortalAccess(Request $request, string $vendorId): JsonResponse
    {
        try {
            // Validate request
            $validated = $request->validate([
                'send_welcome_email' => 'boolean',
            ]);

            // Get tenant ID from request (set by TenantContextMiddleware)
            $tenantId = $request->get('tenant_id');
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

            // Create command
            $command = new OnboardVendorCommand(
                vendorId: (int) $vendorId,
                tenantId: $tenantId,
                adminUserId: $adminUserId,
                sendWelcomeEmail: $validated['send_welcome_email'] ?? true
            );

            // Execute use case
            $result = $this->onboardVendorUseCase->execute($command);

            Log::info('Vendor portal access enabled', [
                'vendor_id' => $vendorId,
                'tenant_id' => $tenantId,
                'admin_user_id' => $adminUserId,
                'welcome_email_sent' => $result['welcome_email_sent'],
            ]);

            return response()->json([
                'message' => 'Portal access enabled successfully',
                'data' => [
                    'vendor_id' => $result['vendor_id'],
                    'vendor_uuid' => $result['vendor_uuid'],
                    'vendor_name' => $result['vendor_name'],
                    'vendor_email' => $result['vendor_email'],
                    'temporary_password' => $result['temporary_password'],
                    'portal_access_enabled' => $result['portal_access_enabled'],
                    'onboarding_status' => $result['onboarding_status'],
                    'temporary_password_expires_at' => $result['temporary_password_expires_at'],
                    'welcome_email_sent' => $result['welcome_email_sent'],
                ]
            ], 200);

        } catch (InvalidArgumentException $e) {
            Log::warning('Failed to enable portal access', [
                'vendor_id' => $vendorId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'VALIDATION_ERROR'
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error enabling portal access', [
                'vendor_id' => $vendorId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to enable portal access',
                'error' => 'SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Resend welcome email to a vendor
     * 
     * POST /api/v1/admin/vendors/{vendorId}/resend-welcome-email
     * 
     * @param Request $request
     * @param string $vendorId
     * @return JsonResponse
     */
    public function resendWelcomeEmail(Request $request, string $vendorId): JsonResponse
    {
        try {
            // Get tenant ID from request (set by TenantContextMiddleware)
            $tenantId = $request->get('tenant_id');
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

            // Create command
            $command = new ResendWelcomeEmailCommand(
                vendorId: (int) $vendorId,
                tenantId: (int) $tenantId,
                adminUserId: (int) $adminUserId
            );

            // Execute use case
            $result = $this->resendWelcomeEmailUseCase->execute($command);

            Log::info('Welcome email resent to vendor', [
                'vendor_id' => $vendorId,
                'tenant_id' => $tenantId,
                'admin_user_id' => $adminUserId,
                'email_sent' => $result['email_sent'],
            ]);

            return response()->json([
                'message' => 'Welcome email resent successfully',
                'data' => [
                    'vendor_id' => $result['vendor_id'],
                    'vendor_uuid' => $result['vendor_uuid'],
                    'vendor_name' => $result['vendor_name'],
                    'vendor_email' => $result['vendor_email'],
                    'welcome_email_sent_at' => $result['welcome_email_sent_at'],
                    'email_sent' => $result['email_sent'],
                ]
            ], 200);

        } catch (InvalidArgumentException $e) {
            Log::warning('Failed to resend welcome email', [
                'vendor_id' => $vendorId,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
                'error' => 'VALIDATION_ERROR'
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error resending welcome email', [
                'vendor_id' => $vendorId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to resend welcome email',
                'error' => 'SERVER_ERROR'
            ], 500);
        }
    }

    /**
     * Get vendor portal access status
     * 
     * GET /api/v1/admin/vendors/{vendorId}/portal-status
     * 
     * Returns the vendor's portal access status including:
     * - portal_access_enabled: Whether portal access is enabled
     * - onboarding_status: Current onboarding status (pending, in_progress, completed)
     * - onboarding_completed_at: When onboarding was completed
     * - portal_last_access_at: Last time vendor accessed the portal
     * - welcome_email_sent_at: When welcome email was sent
     * - temporary_password_expires_at: When temporary password expires
     * 
     * Requirements: 2.5, 2.6, 17.7
     * 
     * @param Request $request
     * @param string $vendorId
     * @return JsonResponse
     */
    public function getPortalStatus(Request $request, string $vendorId): JsonResponse
    {
        try {
            // Get tenant ID from request attributes (set by TenantContextMiddleware)
            // Fallback to authenticated user's tenant_id for testing
            $tenantId = $request->attributes->get('tenant_id') ?? $request->user()?->tenant_id;
            
            if (!$tenantId) {
                return response()->json([
                    'message' => 'Tenant context not found',
                    'error' => 'TENANT_CONTEXT_MISSING'
                ], 400);
            }

            // Find vendor by UUID with tenant scoping
            $vendor = \App\Infrastructure\Persistence\Eloquent\Models\Vendor::where('uuid', $vendorId)
                ->where('tenant_id', $tenantId)
                ->first();

            if (!$vendor) {
                return response()->json([
                    'message' => 'Vendor not found',
                    'error' => 'VENDOR_NOT_FOUND'
                ], 404);
            }

            // Get vendor user if exists
            $vendorUser = \App\Infrastructure\Persistence\Eloquent\Models\User::where('vendor_id', $vendor->uuid)
                ->where('account_type', 'vendor')
                ->first();

            Log::info('Retrieved vendor portal status', [
                'vendor_id' => $vendorId,
                'tenant_id' => $tenantId,
                'portal_access_enabled' => $vendor->portal_access_enabled,
                'onboarding_status' => $vendor->onboarding_status,
            ]);

            return response()->json([
                'message' => 'Portal status retrieved successfully',
                'data' => [
                    'vendor_id' => $vendor->id,
                    'vendor_uuid' => $vendor->uuid,
                    'vendor_name' => $vendor->name ?? $vendor->company_name,
                    'vendor_email' => $vendor->email,
                    'portal_access_enabled' => (bool) $vendor->portal_access_enabled,
                    'onboarding_status' => $vendor->onboarding_status ?? 'pending',
                    'onboarding_completed_at' => $vendor->onboarding_completed_at?->toIso8601String(),
                    'portal_last_access_at' => $vendor->portal_last_access_at?->toIso8601String(),
                    'welcome_email_sent_at' => $vendor->welcome_email_sent_at?->toIso8601String(),
                    'temporary_password_expires_at' => $vendor->temporary_password_expires_at?->toIso8601String(),
                    'has_user_account' => $vendorUser !== null,
                    'user_email' => $vendorUser?->email,
                    'user_status' => $vendorUser?->status,
                    'can_access_portal' => $vendor->canAccessPortal(),
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Error retrieving vendor portal status', [
                'vendor_id' => $vendorId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'Failed to retrieve portal status',
                'error' => 'SERVER_ERROR'
            ], 500);
        }
    }
}
