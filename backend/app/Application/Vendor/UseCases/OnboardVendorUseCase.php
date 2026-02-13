<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\OnboardVendorCommand;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Use Case: Onboard Vendor
 * 
 * Creates vendor user account and enables portal access.
 * 
 * Business Rules:
 * - Vendor must exist and belong to tenant
 * - Vendor must not already have a user account
 * - Generate secure temporary password (12 chars)
 * - Enable portal access automatically
 * - Set onboarding status to 'in_progress'
 * - Send welcome email with credentials (handled by controller/event)
 * - Log action to audit trail
 * - Tenant isolation enforced
 */
final class OnboardVendorUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Execute command to onboard vendor
     * 
     * @param OnboardVendorCommand $command
     * @return array Onboarding result with credentials
     * @throws InvalidArgumentException If validation fails
     */
    public function execute(OnboardVendorCommand $command): array
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

        // Check if vendor already has a user account
        $existingUser = DB::table('users')
            ->where('vendor_id', $vendor->uuid)
            ->where('tenant_id', $command->tenantId)
            ->where('account_type', 'vendor')
            ->exists();

        if ($existingUser) {
            throw new InvalidArgumentException('Vendor already has a user account');
        }

        // Check if email is already in use
        $emailExists = DB::table('users')
            ->where('email', $vendor->email)
            ->where('tenant_id', $command->tenantId)
            ->exists();

        if ($emailExists) {
            throw new InvalidArgumentException('Email already in use by another user');
        }

        // Generate temporary password (12 characters: uppercase, lowercase, numbers, special chars)
        $temporaryPassword = $this->generateTemporaryPassword();

        return DB::transaction(function () use ($command, $vendor, $temporaryPassword) {
            // Create vendor user account
            $userId = DB::table('users')->insertGetId([
                'uuid' => Str::uuid()->toString(),
                'tenant_id' => $command->tenantId,
                'vendor_id' => $vendor->uuid,
                'name' => $vendor->contact_person ?? $vendor->name,
                'email' => $vendor->email,
                'password' => Hash::make($temporaryPassword),
                'account_type' => 'vendor',
                'email_verified_at' => null, // Require email verification
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // Update vendor record
            DB::table('vendors')
                ->where('id', $command->vendorId)
                ->where('tenant_id', $command->tenantId)
                ->update([
                    'onboarding_status' => 'in_progress',
                    'portal_access_enabled' => true,
                    'welcome_email_sent_at' => $command->sendWelcomeEmail ? now() : null,
                    'temporary_password_expires_at' => now()->addDays(7), // 7 days to change password
                    'updated_at' => now(),
                ]);

            // Get updated vendor
            $updatedVendor = DB::table('vendors')
                ->where('id', $command->vendorId)
                ->first();

            // Log to audit
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'vendor_onboarded',
                entityType: 'vendor',
                entityId: $command->vendorId,
                userId: $command->adminUserId,
                metadata: [
                    'vendor_uuid' => $vendor->uuid,
                    'vendor_name' => $vendor->name,
                    'vendor_email' => $vendor->email,
                    'user_id' => $userId,
                    'portal_access_enabled' => true,
                    'onboarding_status' => 'in_progress',
                    'welcome_email_sent' => $command->sendWelcomeEmail,
                    'temporary_password_expires_at' => $updatedVendor->temporary_password_expires_at,
                ]
            );

            return [
                'vendor_id' => $updatedVendor->id,
                'vendor_uuid' => $updatedVendor->uuid,
                'vendor_name' => $updatedVendor->name,
                'vendor_email' => $updatedVendor->email,
                'user_id' => $userId,
                'temporary_password' => $temporaryPassword,
                'portal_access_enabled' => true,
                'onboarding_status' => 'in_progress',
                'temporary_password_expires_at' => $updatedVendor->temporary_password_expires_at,
                'welcome_email_sent' => $command->sendWelcomeEmail,
            ];
        });
    }

    /**
     * Generate secure temporary password
     * 
     * @return string 12-character password with mixed case, numbers, and special chars
     */
    private function generateTemporaryPassword(): string
    {
        $uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // Exclude I, O
        $lowercase = 'abcdefghjkmnpqrstuvwxyz'; // Exclude i, l, o
        $numbers = '23456789'; // Exclude 0, 1
        $special = '!@#$%^&*';

        $password = '';
        $password .= $uppercase[random_int(0, strlen($uppercase) - 1)];
        $password .= $uppercase[random_int(0, strlen($uppercase) - 1)];
        $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $password .= $lowercase[random_int(0, strlen($lowercase) - 1)];
        $password .= $numbers[random_int(0, strlen($numbers) - 1)];
        $password .= $numbers[random_int(0, strlen($numbers) - 1)];
        $password .= $special[random_int(0, strlen($special) - 1)];
        $password .= $special[random_int(0, strlen($special) - 1)];

        // Fill remaining 4 characters with random mix
        $allChars = $uppercase . $lowercase . $numbers . $special;
        for ($i = 0; $i < 4; $i++) {
            $password .= $allChars[random_int(0, strlen($allChars) - 1)];
        }

        // Shuffle the password
        return str_shuffle($password);
    }
}
