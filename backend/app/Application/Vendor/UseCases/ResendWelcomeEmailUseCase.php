<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\ResendWelcomeEmailCommand;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Services\Email\EmailServiceInterface;
use App\Infrastructure\Services\Audit\AuditLogServiceInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

/**
 * Resend Welcome Email Use Case
 * 
 * Allows admins to resend the welcome email to a vendor.
 * Updates the welcome_email_sent_at timestamp.
 * 
 * Requirements: 17.8
 */
class ResendWelcomeEmailUseCase
{
    public function __construct(
        private readonly EmailServiceInterface $emailService,
        private readonly AuditLogServiceInterface $auditLogService
    ) {
    }

    /**
     * Execute the use case
     * 
     * @param ResendWelcomeEmailCommand $command
     * @return array
     * @throws InvalidArgumentException
     */
    public function execute(ResendWelcomeEmailCommand $command): array
    {
        return DB::transaction(function () use ($command) {
            // Find vendor
            $vendor = Vendor::where('id', $command->vendorId)
                ->where('tenant_id', $command->tenantId)
                ->first();

            if (!$vendor) {
                throw new InvalidArgumentException('Vendor not found');
            }

            // Check if vendor has portal access enabled
            if (!$vendor->portal_access_enabled) {
                throw new InvalidArgumentException('Vendor does not have portal access enabled');
            }

            // Get vendor user account
            $vendorUser = $vendor->users()->first();
            if (!$vendorUser) {
                throw new InvalidArgumentException('Vendor user account not found');
            }

            // Generate portal URL
            $portalUrl = config('app.frontend_url') . '/vendor/login';

            // Note: We don't have access to the temporary password anymore
            // So we'll send a password reset link instead
            $resetToken = \Illuminate\Support\Str::random(64);
            
            // Store reset token with expiration (60 minutes)
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $vendor->email],
                [
                    'email' => $vendor->email,
                    'token' => hash('sha256', $resetToken),
                    'created_at' => now(),
                    'expires_at' => now()->addMinutes(60),
                ]
            );

            $resetUrl = config('app.frontend_url') . '/vendor/reset-password?token=' . $resetToken . '&email=' . urlencode($vendor->email);

            // Send welcome email with password reset link
            $emailSent = $this->emailService->sendVendorWelcomeEmail(
                vendorEmail: $vendor->email,
                vendorName: $vendor->company_name ?? $vendor->name,
                temporaryPassword: 'Please use the password reset link below',
                portalUrl: $resetUrl
            );

            if (!$emailSent) {
                throw new \RuntimeException('Failed to send welcome email');
            }

            // Update welcome_email_sent_at timestamp
            $vendor->update([
                'welcome_email_sent_at' => now(),
            ]);

            // Log action to audit trail
            $this->auditLogService->logAction(
                tenantId: $command->tenantId,
                userId: $command->adminUserId,
                actionType: 'vendor_welcome_email_resent',
                resourceType: 'vendor',
                resourceId: $vendor->uuid,
                metadata: [
                    'vendor_name' => $vendor->company_name ?? $vendor->name,
                    'vendor_email' => $vendor->email,
                    'welcome_email_sent_at' => $vendor->welcome_email_sent_at->toIso8601String(),
                ]
            );

            Log::info('Welcome email resent to vendor', [
                'vendor_id' => $vendor->id,
                'vendor_uuid' => $vendor->uuid,
                'vendor_email' => $vendor->email,
                'admin_user_id' => $command->adminUserId,
            ]);

            return [
                'vendor_id' => $vendor->id,
                'vendor_uuid' => $vendor->uuid,
                'vendor_name' => $vendor->company_name ?? $vendor->name,
                'vendor_email' => $vendor->email,
                'welcome_email_sent_at' => $vendor->welcome_email_sent_at->toIso8601String(),
                'email_sent' => $emailSent,
            ];
        });
    }
}
