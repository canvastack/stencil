<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\RequestPasswordResetCommand;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Use Case: Request Password Reset
 * 
 * Handles password reset requests for vendor users.
 * 
 * Business Rules:
 * - Email must exist and belong to a vendor user
 * - User must have portal access enabled
 * - Reset token is valid for 60 minutes
 * - Rate limiting: 1 request per 60 seconds per email
 * - Action is logged for security audit
 */
final class RequestPasswordResetUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Execute password reset request
     * 
     * @param RequestPasswordResetCommand $command
     * @return string Reset token
     */
    public function execute(RequestPasswordResetCommand $command): string
    {
        return DB::transaction(function () use ($command) {
            // Find user by email
            $user = DB::table('users')
                ->where('email', $command->email)
                ->where('tenant_id', $command->tenantId)
                ->where('account_type', 'vendor')
                ->first();

            if (!$user) {
                // Log failed attempt (don't reveal if email exists)
                $this->auditLogRepository->create(
                    tenantId: (int) $command->tenantId,
                    action: 'password_reset_request_failed',
                    entityType: 'user',
                    entityId: null,
                    userId: null,
                    metadata: [
                        'email' => $command->email,
                        'reason' => 'user_not_found',
                        'requested_at' => now()->toIso8601String(),
                        'user_agent' => request()->userAgent(),
                    ],
                    ipAddress: request()->ip()
                );

                throw new InvalidArgumentException('If an account exists with this email, you will receive a password reset link.');
            }

            // Check if vendor has portal access
            // Find vendor by user's vendor_id (UUID)
            $vendor = DB::table('vendors')
                ->where('uuid', $user->vendor_id)
                ->where('tenant_id', $command->tenantId)
                ->first();
            
            if (!$vendor || 
                !$vendor->portal_access_enabled || 
                $vendor->status !== 'active' ||
                $vendor->onboarding_status !== 'completed') {
                $this->auditLogRepository->create(
                    tenantId: (int) $command->tenantId,
                    action: 'password_reset_request_denied',
                    entityType: 'user',
                    entityId: (int) $user->id,
                    userId: (int) $user->id,
                    metadata: [
                        'email' => $command->email,
                        'reason' => 'portal_access_disabled',
                        'requested_at' => now()->toIso8601String(),
                        'user_agent' => request()->userAgent(),
                    ],
                    ipAddress: request()->ip()
                );

                throw new InvalidArgumentException('Portal access is not enabled for this account.');
            }

            // Check rate limiting (1 request per 60 seconds)
            $recentRequest = DB::table('password_reset_tokens')
                ->where('email', $command->email)
                ->where('created_at', '>', now()->subSeconds(60))
                ->exists();

            if ($recentRequest) {
                throw new InvalidArgumentException('Please wait before requesting another password reset.');
            }

            // Generate reset token
            $token = Str::random(64);
            $hashedToken = hash('sha256', $token);

            // Store reset token (expires in 60 minutes)
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $command->email],
                [
                    'email' => $command->email,
                    'token' => $hashedToken,
                    'expires_at' => now()->addMinutes(60),
                    'created_at' => now(),
                ]
            );

            // Log successful request
            $this->auditLogRepository->create(
                tenantId: (int) $command->tenantId,
                action: 'password_reset_requested',
                entityType: 'user',
                entityId: (int) $user->id,
                userId: (int) $user->id,
                metadata: [
                    'email' => $command->email,
                    'token_expires_at' => now()->addMinutes(60)->toIso8601String(),
                    'requested_at' => now()->toIso8601String(),
                    'user_agent' => request()->userAgent(),
                ],
                ipAddress: request()->ip()
            );

            // Return plain token (will be sent via email)
            return $token;
        });
    }
}
