<?php

namespace App\Http\Controllers\Api\Admin;

use App\Application\VendorProduction\UseCases\GetProductionUpdatesUseCase;
use App\Http\Controllers\Controller;
use App\Models\VendorProductionUpdate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Admin Production Update Controller
 * 
 * Handles production update viewing for admins.
 */
class AdminProductionUpdateController extends Controller
{
    public function __construct(
        private GetProductionUpdatesUseCase $getUseCase
    ) {}

    /**
     * Get all production updates for a purchase order
     * 
     * GET /api/admin/purchase-orders/{uuid}/production-updates
     */
    public function index(Request $request, string $uuid): JsonResponse
    {
        try {
            $tenantId = $request->header('X-Tenant-ID');

            $updates = $this->getUseCase->execute($uuid, $tenantId);

            return response()->json([
                'success' => true,
                'data' => $updates->map(fn($update) => $this->transformUpdate($update)),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get recent production updates across all POs
     * 
     * GET /api/admin/production-updates/recent
     */
    public function recent(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->header('X-Tenant-ID');
            $limit = $request->input('limit', 20);

            $updates = $this->getUseCase->getRecentUpdates($tenantId, $limit);

            return response()->json([
                'success' => true,
                'data' => $updates->map(fn($update) => $this->transformUpdate($update)),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    /**
     * Get a single production update
     * 
     * GET /api/admin/production-updates/{uuid}
     */
    public function show(Request $request, string $uuid): JsonResponse
    {
        try {
            $tenantId = $request->header('X-Tenant-ID');

            $update = VendorProductionUpdate::where('uuid', $uuid)
                ->where('tenant_id', $tenantId)
                ->with(['purchaseOrder', 'vendor', 'creator'])
                ->firstOrFail();

            return response()->json([
                'success' => true,
                'data' => $this->transformUpdate($update),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Production update not found',
            ], 404);
        }
    }

    /**
     * Get milestone updates for a purchase order
     * 
     * GET /api/admin/purchase-orders/{uuid}/production-updates/milestones
     */
    public function milestones(Request $request, string $uuid): JsonResponse
    {
        try {
            $tenantId = $request->header('X-Tenant-ID');

            $updates = $this->getUseCase->getMilestones($uuid, $tenantId);

            return response()->json([
                'success' => true,
                'data' => $updates->map(fn($update) => $this->transformUpdate($update)),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
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
                'order_number' => $update->purchaseOrder->order->order_number ?? null,
            ],
            'vendor' => [
                'uuid' => $update->vendor->uuid ?? null,
                'name' => $update->vendor->name ?? null,
                'email' => $update->vendor->email ?? null,
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
