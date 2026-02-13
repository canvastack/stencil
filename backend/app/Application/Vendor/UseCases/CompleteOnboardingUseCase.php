<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\CompleteOnboardingCommand;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Use Case: Complete Onboarding
 * 
 * Marks vendor onboarding as completed after all steps are done.
 * 
 * Business Rules:
 * - Vendor must exist and belong to tenant
 * - Vendor must be in 'in_progress' onboarding status
 * - Update onboarding status to 'completed'
 * - Set onboarding_completed_at timestamp
 * - Log action to audit trail
 * - Tenant isolation enforced
 */
final class CompleteOnboardingUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Execute command to complete vendor onboarding
     * 
     * @param CompleteOnboardingCommand $command
     * @return array Completion result
     * @throws InvalidArgumentException If validation fails
     */
    public function execute(CompleteOnboardingCommand $command): array
    {
        // Get vendor
        $vendor = DB::table('vendors')
            ->where('id', $command->vendorId)
            ->where('tenant_id', $command->tenantId)
            ->whereNull('deleted_at')
            ->first();

        if (!$vendor) {
            throw new InvalidArgumentException('Vendor not found');
        }

        // Check if onboarding is in progress
        if ($vendor->onboarding_status !== 'in_progress') {
            throw new InvalidArgumentException('Vendor onboarding is not in progress');
        }

        // Get vendor user for audit
        $vendorUser = DB::table('users')
            ->where('vendor_id', $vendor->uuid)
            ->where('tenant_id', $command->tenantId)
            ->where('account_type', 'vendor')
            ->first();

        if (!$vendorUser) {
            throw new InvalidArgumentException('Vendor user account not found');
        }

        return DB::transaction(function () use ($command, $vendor, $vendorUser) {
            // Update vendor onboarding status
            DB::table('vendors')
                ->where('id', $command->vendorId)
                ->where('tenant_id', $command->tenantId)
                ->update([
                    'onboarding_status' => 'completed',
                    'onboarding_completed_at' => now(),
                    'updated_at' => now(),
                ]);

            // Get updated vendor
            $updatedVendor = DB::table('vendors')
                ->where('id', $command->vendorId)
                ->first();

            // Log to audit
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'vendor_onboarding_completed',
                entityType: 'vendor',
                entityId: $command->vendorId,
                userId: $vendorUser->id,
                metadata: [
                    'vendor_uuid' => $vendor->uuid,
                    'vendor_name' => $vendor->name,
                    'old_status' => 'in_progress',
                    'new_status' => 'completed',
                    'completed_at' => $updatedVendor->onboarding_completed_at,
                ]
            );

            return [
                'vendor_id' => $updatedVendor->id,
                'vendor_uuid' => $updatedVendor->uuid,
                'vendor_name' => $updatedVendor->name,
                'onboarding_status' => 'completed',
                'onboarding_completed_at' => $updatedVendor->onboarding_completed_at,
                'portal_access_enabled' => $updatedVendor->portal_access_enabled,
            ];
        });
    }
}
