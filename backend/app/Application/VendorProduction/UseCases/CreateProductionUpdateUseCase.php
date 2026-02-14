<?php

namespace App\Application\VendorProduction\UseCases;

use App\Application\VendorProduction\Commands\CreateProductionUpdateCommand;
use App\Domain\VendorProduction\Events\ProductionCompleted;
use App\Domain\VendorProduction\Events\ProductionStatusChanged;
use App\Domain\VendorProduction\Events\ProductionUpdateCreated;
use App\Exceptions\VendorProduction\BusinessLogicException;
use App\Exceptions\VendorProduction\ResourceNotFoundException;
use App\Exceptions\VendorProduction\UnauthorizedAccessException;
use App\Models\VendorProductionUpdate;
use App\Models\VendorPurchaseOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Use Case: Create Production Update
 * 
 * Creates a new production update for a purchase order.
 * Updates the PO's latest production status.
 * Handles photo uploads and storage.
 */
class CreateProductionUpdateUseCase
{
    /**
     * Execute the use case
     * 
     * @param CreateProductionUpdateCommand $command
     * @return VendorProductionUpdate
     * @throws ResourceNotFoundException
     * @throws UnauthorizedAccessException
     * @throws BusinessLogicException
     */
    public function execute(CreateProductionUpdateCommand $command): VendorProductionUpdate
    {
        return DB::transaction(function () use ($command) {
            Log::info('[CreateProductionUpdate] Starting', [
                'po_uuid' => $command->purchaseOrderUuid,
                'vendor_id' => $command->vendorId,
                'status' => $command->status,
            ]);

            // Find purchase order
            $purchaseOrder = VendorPurchaseOrder::where('uuid', $command->purchaseOrderUuid)
                ->where('tenant_id', $command->tenantId)
                ->first();

            if (!$purchaseOrder) {
                throw new ResourceNotFoundException('Purchase order not found');
            }

            // Validate vendor ownership
            if ($purchaseOrder->vendor_id !== $command->vendorId) {
                throw new UnauthorizedAccessException('Unauthorized: You do not own this purchase order');
            }

            // Validate PO status (must be accepted)
            if ($purchaseOrder->status !== 'accepted') {
                throw new BusinessLogicException('Purchase order must be accepted before creating production updates');
            }

            // Validate status transition if there are existing updates
            // Force fresh query to avoid stale relationship data
            // Order by both created_at and id to handle same-timestamp scenarios (common in tests)
            $latestUpdate = VendorProductionUpdate::where('purchase_order_id', $purchaseOrder->id)
                ->orderBy('created_at', 'desc')
                ->orderBy('id', 'desc')
                ->first();
            
            if ($latestUpdate && !$latestUpdate->canTransitionTo($command->status)) {
                throw new BusinessLogicException("Cannot transition from {$latestUpdate->status} to {$command->status}");
            }

            // Validate progress percentage
            if ($command->progressPercentage < 0 || $command->progressPercentage > 100) {
                throw new BusinessLogicException('Progress percentage must be between 0 and 100');
            }

            // Validate completed status requires 100% progress
            if ($command->status === VendorProductionUpdate::STATUS_COMPLETED && $command->progressPercentage !== 100) {
                throw new BusinessLogicException('Completed status requires 100% progress');
            }

            // Validate delayed status requires estimated completion date
            if ($command->status === VendorProductionUpdate::STATUS_DELAYED && !$command->estimatedCompletionDate) {
                throw new BusinessLogicException('Delayed status requires estimated completion date');
            }

            // Create production update
            $update = VendorProductionUpdate::create([
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $command->tenantId,
                'purchase_order_id' => $purchaseOrder->id,
                'vendor_id' => $command->vendorId,
                'status' => $command->status,
                'progress_percentage' => $command->progressPercentage,
                'notes' => $command->notes,
                'estimated_completion_date' => $command->estimatedCompletionDate 
                    ? new \DateTime($command->estimatedCompletionDate) 
                    : null,
                'actual_completion_date' => $command->status === VendorProductionUpdate::STATUS_COMPLETED 
                    ? now() 
                    : null,
                'photos' => $command->photos,
                'is_milestone' => $command->isMilestone,
                'created_by' => $command->createdBy,
            ]);

            // Update purchase order latest status
            $this->updatePurchaseOrderStatus($purchaseOrder, $update);

            // Dispatch events
            $this->dispatchEvents($purchaseOrder, $update, $latestUpdate);

            Log::info('[CreateProductionUpdate] Completed', [
                'update_uuid' => $update->uuid,
                'status' => $update->status,
                'progress' => $update->progress_percentage,
            ]);

            return $update->fresh(['purchaseOrder', 'vendor', 'creator']);
        });
    }

    /**
     * Update purchase order with latest production status
     */
    private function updatePurchaseOrderStatus(VendorPurchaseOrder $po, VendorProductionUpdate $update): void
    {
        $updateData = [
            'latest_production_status' => $update->status,
            'latest_progress_percentage' => $update->progress_percentage,
            'latest_update_at' => $update->created_at,
        ];

        // Set production started timestamp on first update
        if (!$po->production_started_at && $update->status === VendorProductionUpdate::STATUS_STARTED) {
            $updateData['production_started_at'] = $update->created_at;
        }

        // Set production completed timestamp
        if ($update->status === VendorProductionUpdate::STATUS_COMPLETED) {
            $updateData['production_completed_at'] = $update->actual_completion_date;
        }

        $po->update($updateData);
    }

    /**
     * Dispatch domain events for the production update
     */
    private function dispatchEvents(
        VendorPurchaseOrder $po,
        VendorProductionUpdate $update,
        ?VendorProductionUpdate $previousUpdate
    ): void {
        // Always dispatch ProductionUpdateCreated event
        event(new ProductionUpdateCreated($update, $po));

        // Dispatch ProductionStatusChanged if status changed
        $oldStatus = $previousUpdate?->status;
        if ($oldStatus !== $update->status) {
            event(new ProductionStatusChanged(
                $po,
                $oldStatus,
                $update->status,
                $update->progress_percentage
            ));
        }

        // Dispatch ProductionCompleted if status is completed
        if ($update->status === VendorProductionUpdate::STATUS_COMPLETED) {
            event(new ProductionCompleted($po, $update));
        }
    }
}
