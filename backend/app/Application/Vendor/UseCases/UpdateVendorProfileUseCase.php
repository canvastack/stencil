<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\UpdateVendorProfileCommand;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Use Case: Update Vendor Profile
 * 
 * Allows vendor to update their profile information.
 * 
 * Business Rules:
 * - Vendor must exist and belong to tenant
 * - Email must be unique if changed
 * - Cannot change company name (admin only)
 * - Tenant isolation enforced
 * - Creates audit log entry
 * - Email change requires verification (handled by controller)
 */
final class UpdateVendorProfileUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Execute command to update vendor profile
     * 
     * @param UpdateVendorProfileCommand $command
     * @return array Updated vendor data
     * @throws InvalidArgumentException If validation fails
     */
    public function execute(UpdateVendorProfileCommand $command): array
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

        // Store old values for audit
        $oldValues = [
            'email' => $vendor->email,
            'phone' => $vendor->phone,
            'contact_person' => $vendor->contact_person,
            'address' => $vendor->address,
            'location' => $vendor->location,
        ];

        // Prepare update data
        $updateData = ['updated_at' => now()];
        $newValues = [];

        if ($command->email !== null && $command->email !== $vendor->email) {
            // Check email uniqueness
            $emailExists = DB::table('vendors')
                ->where('email', $command->email)
                ->where('tenant_id', $command->tenantId)
                ->where('id', '!=', $command->vendorId)
                ->whereNull('deleted_at')
                ->exists();

            if ($emailExists) {
                throw new InvalidArgumentException('Email already in use by another vendor');
            }

            $updateData['email'] = $command->email;
            $newValues['email'] = $command->email;
        }

        if ($command->phone !== null) {
            $updateData['phone'] = $command->phone;
            $newValues['phone'] = $command->phone;
        }

        if ($command->contactPerson !== null) {
            $updateData['contact_person'] = $command->contactPerson;
            $newValues['contact_person'] = $command->contactPerson;
        }

        if ($command->address !== null) {
            $updateData['address'] = $command->address;
            $newValues['address'] = $command->address;
        }

        if ($command->location !== null) {
            $updateData['location'] = json_encode($command->location);
            $newValues['location'] = $command->location;
        }

        return DB::transaction(function () use ($command, $vendor, $updateData, $oldValues, $newValues) {
            // Update vendor
            DB::table('vendors')
                ->where('id', $command->vendorId)
                ->where('tenant_id', $command->tenantId)
                ->update($updateData);

            // Get updated vendor
            $updatedVendor = DB::table('vendors')
                ->where('id', $command->vendorId)
                ->first();

            // Get vendor user for audit
            $vendorUser = DB::table('users')
                ->where('vendor_id', $vendor->uuid)
                ->where('tenant_id', $command->tenantId)
                ->where('account_type', 'vendor')
                ->first();

            // Log to audit
            if ($vendorUser) {
                $this->auditLogRepository->create(
                    tenantId: $command->tenantId,
                    action: 'vendor_profile_updated',
                    entityType: 'vendor',
                    entityId: $command->vendorId,
                    userId: $vendorUser->id,
                    metadata: [
                        'old_values' => array_filter($oldValues, fn($key) => isset($newValues[$key]), ARRAY_FILTER_USE_KEY),
                        'new_values' => $newValues,
                        'fields_updated' => array_keys($newValues),
                    ]
                );
            }

            return [
                'id' => $updatedVendor->id,
                'uuid' => $updatedVendor->uuid,
                'company_name' => $updatedVendor->company_name,
                'email' => $updatedVendor->email,
                'phone' => $updatedVendor->phone,
                'contact_person' => $updatedVendor->contact_person,
                'address' => $updatedVendor->address,
                'location' => json_decode($updatedVendor->location ?? '{}', true),
                'status' => $updatedVendor->status,
                'updated_at' => $updatedVendor->updated_at,
            ];
        });
    }
}
