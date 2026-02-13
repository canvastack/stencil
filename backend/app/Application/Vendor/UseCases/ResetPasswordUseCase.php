<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\ResetPasswordCommand;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use InvalidArgumentException;

/**
 * Use Case: Reset Password
 * 
 * Handles password reset for vendor users using a valid reset token.
 * 
 * Business Rules:
 * - Token must be valid and not expired (60 minutes)
 * - Password must meet strength requirements (min 8 chars, uppercase, lowercase, number, special char)
 * - Password and confirmation must match
 * - Token is invalidated after successful reset
 * - All existing sessions are revoked for security
 * - Action is logged for security audit
 */
final class ResetPasswordUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Execute password reset
     * 
     * @param ResetPasswordCommand $command
     * @return bool True if reset successful
     */
    public function execute(ResetPasswordCommand $command): bool
    {
        return DB::transaction(function () use ($command) {
            // Validate password confirmation
            if ($command->password !== $command->passwordConfirmation) {
                throw new InvalidArgumentException('Password confirmation does not match.');
            }

            // Validate password strength
            $this->validatePasswordStrength($command->password);

            // Find user by email
            $user = DB::table('users')
                ->where('email', $command->email)
                ->where('tenant_id', $command->tenantId)
                ->where('account_type', 'vendor')
                ->first();

            if (!$user) {
                $this->auditLogRepository->create(
                    tenantId: (int) $command->tenantId,
                    action: 'password_reset_failed',
                    entityType: 'user',
                    entityId: null,
                    userId: null,
                    metadata: [
                        'email' => $command->email,
                        'reason' => 'user_not_found',
                        'attempted_at' => now()->toIso8601String(),
                        'user_agent' => request()->userAgent(),
                    ],
                    ipAddress: request()->ip()
                );

                throw new InvalidArgumentException('Invalid password reset token.');
            }

            // Verify reset token
            $hashedToken = hash('sha256', $command->token);
            $resetRecord = DB::table('password_reset_tokens')
                ->where('email', $command->email)
                ->where('token', $hashedToken)
                ->first();

            if (!$resetRecord) {
                $this->auditLogRepository->create(
                    tenantId: (int) $command->tenantId,
                    action: 'password_reset_failed',
                    entityType: 'user',
                    entityId: (int) $user->id,
                    userId: (int) $user->id,
                    metadata: [
                        'email' => $command->email,
                        'reason' => 'invalid_token',
                        'attempted_at' => now()->toIso8601String(),
                        'user_agent' => request()->userAgent(),
                    ],
                    ipAddress: request()->ip()
                );

                throw new InvalidArgumentException('Invalid password reset token.');
            }

            // Check if token is expired (60 minutes)
            $tokenAge = now()->diffInMinutes($resetRecord->created_at);
            if ($tokenAge > 60) {
                // Delete expired token
                DB::table('password_reset_tokens')
                    ->where('email', $command->email)
                    ->delete();

                $this->auditLogRepository->create(
                    tenantId: (int) $command->tenantId,
                    action: 'password_reset_failed',
                    entityType: 'user',
                    entityId: (int) $user->id,
                    userId: (int) $user->id,
                    metadata: [
                        'email' => $command->email,
                        'reason' => 'token_expired',
                        'token_age_minutes' => $tokenAge,
                        'attempted_at' => now()->toIso8601String(),
                        'user_agent' => request()->userAgent(),
                    ],
                    ipAddress: request()->ip()
                );

                throw new InvalidArgumentException('Password reset token has expired. Please request a new one.');
            }

            // Update password
            DB::table('users')
                ->where('id', $user->id)
                ->update([
                    'password' => Hash::make($command->password),
                    'updated_at' => now(),
                ]);

            // Invalidate reset token
            DB::table('password_reset_tokens')
                ->where('email', $command->email)
                ->delete();

            // Revoke all existing tokens for security
            DB::table('personal_access_tokens')
                ->where('tokenable_id', $user->id)
                ->where('tokenable_type', 'App\Models\User')
                ->delete();

            // Log successful password reset
            $this->auditLogRepository->create(
                tenantId: (int) $command->tenantId,
                action: 'password_reset_completed',
                entityType: 'user',
                entityId: (int) $user->id,
                userId: (int) $user->id,
                metadata: [
                    'email' => $command->email,
                    'tokens_revoked' => DB::table('personal_access_tokens')
                        ->where('tokenable_id', $user->id)
                        ->count(),
                    'reset_at' => now()->toIso8601String(),
                    'user_agent' => request()->userAgent(),
                ],
                ipAddress: request()->ip()
            );

            return true;
        });
    }

    /**
     * Validate password strength
     * 
     * Requirements:
     * - Minimum 8 characters
     * - At least one uppercase letter
     * - At least one lowercase letter
     * - At least one number
     * - At least one special character
     * 
     * @param string $password
     * @throws InvalidArgumentException If password doesn't meet requirements
     */
    private function validatePasswordStrength(string $password): void
    {
        if (strlen($password) < 8) {
            throw new InvalidArgumentException('Password must be at least 8 characters long.');
        }

        if (!preg_match('/[A-Z]/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one uppercase letter.');
        }

        if (!preg_match('/[a-z]/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one lowercase letter.');
        }

        if (!preg_match('/[0-9]/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one number.');
        }

        if (!preg_match('/[^A-Za-z0-9]/', $password)) {
            throw new InvalidArgumentException('Password must contain at least one special character.');
        }
    }
}
