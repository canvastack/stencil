<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class VendorSpecializationController extends Controller
{
    /**
     * Get all specializations for a vendor
     * Endpoint: GET /vendors/{vendorId}/specializations
     */
    public function index(Request $request, string $vendorId): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail((int) $vendorId);
            
            $specializations = $vendor->specializations ?? [];
            
            // Transform array to object format for consistency
            $formattedSpecializations = collect($specializations)->map(function ($spec, $index) use ($vendor) {
                if (is_string($spec)) {
                    return [
                        'id' => $index + 1,
                        'vendor_id' => $vendor->id,
                        'name' => $spec,
                        'category' => $this->categorizeSpecialization($spec),
                        'experience_years' => null,
                        'certification' => null,
                    ];
                }
                
                return [
                    'id' => $spec['id'] ?? $index + 1,
                    'vendor_id' => $vendor->id,
                    'name' => $spec['name'] ?? $spec,
                    'category' => $spec['category'] ?? $this->categorizeSpecialization($spec['name'] ?? $spec),
                    'experience_years' => $spec['experience_years'] ?? null,
                    'certification' => $spec['certification'] ?? null,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'message' => 'Vendor specializations retrieved successfully',
                'data' => $formattedSpecializations,
                'meta' => [
                    'vendor_id' => $vendorId,
                    'vendor_name' => $vendor->name,
                    'total_specializations' => $formattedSpecializations->count(),
                ],
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendor specializations',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Add a new specialization to a vendor
     * Endpoint: POST /vendors/{vendorId}/specializations
     */
    public function store(Request $request, string $vendorId): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail((int) $vendorId);

            $validator = Validator::make($request->all(), [
                'name' => 'required|string|max:255',
                'category' => 'nullable|string|max:100',
                'experience_years' => 'nullable|integer|min:0|max:100',
                'certification' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $specializations = $vendor->specializations ?? [];
            
            // Generate new ID
            $maxId = 0;
            foreach ($specializations as $spec) {
                if (is_array($spec) && isset($spec['id'])) {
                    $maxId = max($maxId, $spec['id']);
                }
            }
            $newId = $maxId + 1;

            // Check for duplicates
            foreach ($specializations as $spec) {
                $specName = is_string($spec) ? $spec : ($spec['name'] ?? '');
                if (strtolower($specName) === strtolower($validated['name'])) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Specialization already exists for this vendor',
                    ], 409);
                }
            }

            // Add new specialization
            $newSpecialization = [
                'id' => $newId,
                'name' => $validated['name'],
                'category' => $validated['category'] ?? $this->categorizeSpecialization($validated['name']),
                'experience_years' => $validated['experience_years'] ?? null,
                'certification' => $validated['certification'] ?? null,
            ];

            $specializations[] = $newSpecialization;
            
            $vendor->update([
                'specializations' => $specializations,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Vendor specialization added successfully',
                'data' => array_merge($newSpecialization, ['vendor_id' => $vendor->id]),
            ], 201);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to add vendor specialization',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Update a vendor specialization
     * Endpoint: PUT /vendors/{vendorId}/specializations/{specializationId}
     */
    public function update(Request $request, string $vendorId, string $specializationId): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail((int) $vendorId);

            $validator = Validator::make($request->all(), [
                'name' => 'nullable|string|max:255',
                'category' => 'nullable|string|max:100',
                'experience_years' => 'nullable|integer|min:0|max:100',
                'certification' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            $validated = $validator->validated();
            $specializations = $vendor->specializations ?? [];
            $found = false;

            foreach ($specializations as &$spec) {
                $specId = is_array($spec) && isset($spec['id']) ? $spec['id'] : null;
                if ($specId == $specializationId) {
                    $found = true;
                    $spec = array_merge($spec, array_filter($validated, fn($v) => $v !== null));
                    break;
                }
            }

            if (!$found) {
                return response()->json([
                    'success' => false,
                    'message' => 'Specialization not found',
                ], 404);
            }

            $vendor->update([
                'specializations' => $specializations,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Vendor specialization updated successfully',
                'data' => array_merge($spec, ['vendor_id' => $vendor->id]),
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update vendor specialization',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Delete a vendor specialization
     * Endpoint: DELETE /vendors/{vendorId}/specializations/{specializationId}
     */
    public function destroy(Request $request, string $vendorId, string $specializationId): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail((int) $vendorId);
            $specializations = $vendor->specializations ?? [];
            $found = false;

            $filteredSpecializations = array_filter($specializations, function ($spec) use ($specializationId, &$found) {
                $specId = is_array($spec) && isset($spec['id']) ? $spec['id'] : null;
                if ($specId == $specializationId) {
                    $found = true;
                    return false;
                }
                return true;
            });

            if (!$found) {
                return response()->json([
                    'success' => false,
                    'message' => 'Specialization not found',
                ], 404);
            }

            $vendor->update([
                'specializations' => array_values($filteredSpecializations),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Vendor specialization deleted successfully',
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete vendor specialization',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Categorize specialization based on name
     */
    private function categorizeSpecialization(string $name): string
    {
        $name = strtolower($name);

        if (str_contains($name, 'etching') || str_contains($name, 'engraving')) {
            return 'Etching & Engraving';
        }
        if (str_contains($name, 'metal') || str_contains($name, 'stainless') || str_contains($name, 'brass')) {
            return 'Metalworking';
        }
        if (str_contains($name, 'glass') || str_contains($name, 'acrylic')) {
            return 'Glass & Acrylic';
        }
        if (str_contains($name, 'laser') || str_contains($name, 'cutting')) {
            return 'Laser Services';
        }
        if (str_contains($name, 'printing') || str_contains($name, 'design')) {
            return 'Printing & Design';
        }

        return 'General';
    }
}
