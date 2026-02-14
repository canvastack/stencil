<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Application\VendorProduction\Commands\CreateProductionUpdateCommand;
use App\Application\VendorProduction\Services\ProductionPhotoService;
use App\Application\VendorProduction\UseCases\CreateProductionUpdateUseCase;
use App\Application\VendorProduction\UseCases\GetProductionUpdatesUseCase;
use App\Exceptions\VendorProduction\BusinessLogicException;
use App\Exceptions\VendorProduction\ResourceNotFoundException;
use App\Exceptions\VendorProduction\UnauthorizedAccessException;
use App\Http\Controllers\Controller;
use App\Models\VendorProductionUpdate;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * Vendor Production Update Controller
 * 
 * Handles production update operations for vendors.
 */
class VendorProductionUpdateController extends Controller
{
    public function __construct(
        private CreateProductionUpdateUseCase $createUseCase,
        private GetProductionUpdatesUseCase $getUseCase,
        private ProductionPhotoService $photoService
    ) {}

    /**
     * Get all production updates for a purchase order
     * 
     * GET /api/vendor/purchase-orders/{uuid}/production-updates
     */
    public function index(Request $request, string $uuid): JsonResponse
    {
        try {
            $user = $request->user();
            $tenantId = $request->header('X-Tenant-ID');

            $updates = $this->getUseCase->execute($uuid, $tenantId, $user->id);

            return response()->json([
                'success' => true,
                'data' => $updates->map(fn($update) => $this->transformUpdate($update)),
            ]);
        } catch (ModelNotFoundException | ResourceNotFoundException $e) {
            Log::warning('[VendorProductionUpdate] Index failed - not found', [
                'error' => $e->getMessage(),
                'po_uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Purchase order not found',
            ], 404);

        } catch (\Exception $e) {
            Log::error('[VendorProductionUpdate] Index failed', [
                'error' => $e->getMessage(),
                'po_uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Create a new production update
     * 
     * POST /api/vendor/purchase-orders/{uuid}/production-updates
     */
    public function store(Request $request, string $uuid): JsonResponse
    {
        try {
            $user = $request->user();
            $tenantId = $request->header('X-Tenant-ID');

            // Validate request
            $validator = Validator::make($request->all(), [
                'status' => 'required|in:' . implode(',', VendorProductionUpdate::getValidStatuses()),
                'progress_percentage' => 'required|integer|min:0|max:100',
                'notes' => 'nullable|string|max:2000',
                'estimated_completion_date' => 'nullable|date|after:now',
                'photos' => 'nullable|array|max:10',
                'photos.*' => 'image|mimes:jpeg,png,jpg|max:5120',
                'photo_captions' => 'nullable|array',
                'photo_captions.*' => 'nullable|string|max:255',
                'is_milestone' => 'boolean',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Handle photo uploads
            $photos = [];
            if ($request->hasFile('photos')) {
                $captions = $request->input('photo_captions', []);
                $photos = $this->photoService->uploadMultiplePhotos(
                    $request->file('photos'),
                    $tenantId,
                    $captions
                );
            }

            // Create command
            $command = new CreateProductionUpdateCommand(
                purchaseOrderUuid: $uuid,
                vendorId: $user->id,
                tenantId: $tenantId,
                status: $request->input('status'),
                progressPercentage: $request->input('progress_percentage'),
                notes: $request->input('notes'),
                estimatedCompletionDate: $request->input('estimated_completion_date'),
                photos: $photos,
                isMilestone: $request->boolean('is_milestone', false),
                createdBy: $user->id
            );

            // Execute use case
            $update = $this->createUseCase->execute($command);

            return response()->json([
                'success' => true,
                'message' => 'Production update created successfully',
                'data' => $this->transformUpdate($update),
            ], 201);

        } catch (UnauthorizedAccessException $e) {
            Log::warning('[VendorProductionUpdate] Store failed - unauthorized', [
                'error' => $e->getMessage(),
                'po_uuid' => $uuid,
                'vendor_id' => $user->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404); // Return 404 for security (don't reveal resource exists)

        } catch (ResourceNotFoundException $e) {
            Log::warning('[VendorProductionUpdate] Store failed - not found', [
                'error' => $e->getMessage(),
                'po_uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 404);

        } catch (BusinessLogicException $e) {
            Log::info('[VendorProductionUpdate] Store failed - business logic', [
                'error' => $e->getMessage(),
                'po_uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => [
                    'business_logic' => [$e->getMessage()]
                ],
            ], 422);

        } catch (\Exception $e) {
            Log::error('[VendorProductionUpdate] Store failed', [
                'error' => $e->getMessage(),
                'po_uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get a single production update
     * 
     * GET /api/vendor/production-updates/{uuid}
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        try {
            $user = $request->user();
            $tenantId = $request->header('X-Tenant-ID');

            $update = VendorProductionUpdate::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->where('vendor_id', $user->id)
                ->with(['purchaseOrder', 'vendor', 'creator'])
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $this->transformUpdate($update),
            ]);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Production update not found',
            ], 404);

        } catch (\Exception $e) {
            Log::error('[VendorProductionUpdate] Show failed', [
                'error' => $e->getMessage(),
                'uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Add photos to an existing production update
     * 
     * POST /api/vendor/production-updates/{uuid}/photos
     */
    public function addPhotos(Request $request, string $uuid): JsonResponse
    {
        try {
            $user = $request->user();
            $tenantId = $request->header('X-Tenant-ID');

            // Validate request
            $validator = Validator::make($request->all(), [
                'photos' => 'required|array|max:10',
                'photos.*' => 'image|mimes:jpeg,png,jpg|max:5120',
                'photo_captions' => 'nullable|array',
                'photo_captions.*' => 'nullable|string|max:255',
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Validation failed',
                    'errors' => $validator->errors(),
                ], 422);
            }

            // Find production update
            $update = VendorProductionUpdate::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->where('vendor_id', $user->id)
                ->firstOrFail();

            // Check photo limit
            $currentPhotoCount = is_array($update->photos) ? count($update->photos) : 0;
            $newPhotoCount = count($request->file('photos'));
            
            if ($currentPhotoCount + $newPhotoCount > 10) {
                return response()->json([
                    'success' => false,
                    'message' => 'Maximum 10 photos allowed per update',
                ], 422);
            }

            // Upload new photos
            $captions = $request->input('photo_captions', []);
            $newPhotos = $this->photoService->uploadMultiplePhotos(
                $request->file('photos'),
                $tenantId,
                $captions
            );

            // Merge with existing photos
            $existingPhotos = $update->photos ?? [];
            $allPhotos = array_merge($existingPhotos, $newPhotos);
            
            $update->photos = $allPhotos;
            $update->save();

            Log::info('[VendorProductionUpdate] Photos added', [
                'update_uuid' => $uuid,
                'photo_count' => count($newPhotos),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photos added successfully',
                'data' => [
                    'photos_added' => count($newPhotos),
                    'total_photos' => count($allPhotos),
                    'new_photos' => $newPhotos,
                ],
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Production update not found',
            ], 404);

        } catch (\Exception $e) {
            Log::error('[VendorProductionUpdate] Add photos failed', [
                'error' => $e->getMessage(),
                'update_uuid' => $uuid,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Delete a photo from a production update
     * 
     * DELETE /api/vendor/production-updates/{uuid}/photos/{photoId}
     */
    public function deletePhoto(Request $request, string $uuid, string $photoId): JsonResponse
    {
        try {
            $user = $request->user();
            $tenantId = $request->header('X-Tenant-ID');

            // Find production update
            $update = VendorProductionUpdate::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->where('vendor_id', $user->id)
                ->firstOrFail();

            // Find and remove photo from array
            $photos = $update->photos ?? [];
            $photoFound = false;
            $updatedPhotos = [];

            foreach ($photos as $photo) {
                if ($photo['id'] === $photoId) {
                    $photoFound = true;
                    // Delete from storage
                    $this->photoService->deletePhoto($photoId, $tenantId);
                } else {
                    $updatedPhotos[] = $photo;
                }
            }

            if (!$photoFound) {
                return response()->json([
                    'success' => false,
                    'message' => 'Photo not found',
                ], 404);
            }

            // Update photos array
            $update->photos = $updatedPhotos;
            $update->save();

            Log::info('[VendorProductionUpdate] Photo deleted', [
                'update_uuid' => $uuid,
                'photo_id' => $photoId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Photo deleted successfully',
                'data' => [
                    'remaining_photos' => count($updatedPhotos),
                ],
            ]);

        } catch (ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Production update not found',
            ], 404);

        } catch (\Exception $e) {
            Log::error('[VendorProductionUpdate] Delete photo failed', [
                'error' => $e->getMessage(),
                'update_uuid' => $uuid,
                'photo_id' => $photoId,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Transform production update for API response
     */
    private function transformUpdate(VendorProductionUpdate $update): array
    {
        return [
            'uuid' => $update->uuid,
            'purchase_order' => [
                'uuid' => $update->purchaseOrder->uuid ?? null,
                'po_number' => $update->purchaseOrder->po_number ?? null,
            ],
            'vendor' => [
                'uuid' => $update->vendor->uuid ?? null,
                'name' => $update->vendor->name ?? null,
            ],
            'status' => $update->status,
            'status_display' => $update->status_display_name,
            'status_color' => $update->status_color,
            'progress_percentage' => $update->progress_percentage,
            'notes' => $update->notes,
            'estimated_completion_date' => $update->estimated_completion_date?->toISOString(),
            'actual_completion_date' => $update->actual_completion_date?->toISOString(),
            'photos' => $update->photos ?? [],
            'photo_count' => $update->photo_count,
            'is_milestone' => $update->is_milestone,
            'is_overdue' => $update->isOverdue(),
            'is_completed' => $update->isCompleted(),
            'is_delayed' => $update->isDelayed(),
            'days_until_completion' => $update->days_until_completion,
            'days_since_update' => $update->days_since_update,
            'created_by' => [
                'uuid' => $update->creator->uuid ?? null,
                'name' => $update->creator->name ?? null,
            ],
            'created_at' => $update->created_at->toISOString(),
            'updated_at' => $update->updated_at->toISOString(),
        ];
    }
}
