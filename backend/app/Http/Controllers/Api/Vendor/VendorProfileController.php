<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Application\Vendor\Commands\UpdateVendorProfileCommand;
use App\Application\Vendor\Queries\GetVendorProfileQuery;
use App\Application\Vendor\UseCases\GetVendorProfileUseCase;
use App\Application\Vendor\UseCases\UpdateVendorProfileUseCase;
use App\Http\Controllers\Controller;
use App\Http\Requests\Vendor\UpdateProfileRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * VendorProfileController
 * 
 * Handles vendor profile management endpoints.
 * 
 * Endpoints:
 * - GET /api/v1/vendor/profile - Get vendor profile
 * - PUT /api/v1/vendor/profile - Update vendor profile
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */
class VendorProfileController extends Controller
{
    public function __construct(
        private readonly GetVendorProfileUseCase $getVendorProfileUseCase,
        private readonly UpdateVendorProfileUseCase $updateVendorProfileUseCase
    ) {}

    /**
     * Get vendor profile
     * 
     * GET /api/v1/vendor/profile
     * 
     * Returns vendor profile information including:
     * - Basic vendor information (company_name, email, phone, contact_person, address)
     * - Performance metrics (total_quotes, accepted_quotes, rejected_quotes, acceptance_rate, avg_response_time)
     * - Onboarding status
     * 
     * Requirements: 8.1, 8.2
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $tenantId = $request->tenant_id;

            $query = new GetVendorProfileQuery(
                vendorId: $vendor->id,
                tenantId: $tenantId
            );

            $result = $this->getVendorProfileUseCase->execute($query);

            return response()->json([
                'message' => 'Profile retrieved successfully',
                'data' => $result,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Profile not found',
                'error' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            Log::error('Get vendor profile error', [
                'vendor_id' => $request->vendor?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while retrieving profile',
                'error' => 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update vendor profile
     * 
     * PUT /api/v1/vendor/profile
     * 
     * Request Body:
     * - email: string (optional, email, unique)
     * - phone: string (optional)
     * - contact_person: string (optional)
     * - address: string (optional)
     * - location: object (optional, {latitude: float, longitude: float})
     * 
     * Business Rules:
     * - Cannot change company_name (admin only)
     * - Email must be unique if changed
     * - Email change requires verification (future enhancement)
     * - Creates audit log entry
     * 
     * Requirements: 8.3, 8.4, 8.5
     * 
     * @param UpdateProfileRequest $request
     * @return JsonResponse
     */
    public function update(UpdateProfileRequest $request): JsonResponse
    {
        try {
            $vendor = $request->vendor;
            $tenantId = $request->tenant_id;

            $command = new UpdateVendorProfileCommand(
                vendorId: $vendor->id,
                tenantId: $tenantId,
                email: $request->input('email'),
                phone: $request->input('phone'),
                contactPerson: $request->input('contact_person'),
                address: $request->input('address'),
                location: $request->input('location')
            );

            $result = $this->updateVendorProfileUseCase->execute($command);

            return response()->json([
                'message' => 'Profile updated successfully',
                'data' => $result,
            ], 200);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => 'Invalid request',
                'error' => $e->getMessage(),
            ], 400);
        } catch (\Exception $e) {
            Log::error('Update vendor profile error', [
                'vendor_id' => $request->vendor?->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => 'An error occurred while updating profile',
                'error' => 'Internal server error',
            ], 500);
        }
    }
}
