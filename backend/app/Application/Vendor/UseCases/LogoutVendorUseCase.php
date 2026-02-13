<?php

declare(strict_types=1);

namespace App\Application\Vendor\UseCases;

use App\Application\Vendor\Commands\LogoutVendorCommand;
use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Use Case: Logout Vendor
 * 
 * Handles vendor logout by revoking their authentication token and logging the action.
 * 
 * Business Rules:
 * - Token must exist and belong to the user
 * - Logout action is logged for security audit
 * - All user tokens can be revoked (logout from all devices)
 */
final class LogoutVendorUseCase
{
    public function __construct(
        private readonly AuditLogRepositoryInterface $auditLogRepository
    ) {
    }

    /**
     * Execute vendor logout
     * 
     * @param LogoutVendorCommand $command
     * @return bool True if logout successful
     */
    public function execute(LogoutVendorCommand $command): bool
    {
        return DB::transaction(function () use ($command) {
            // Find and revoke the specific token
            $token = PersonalAccessToken::findToken($command->tokenId);
            
            if ($token && $token->tokenable_id === (int) $command->userId) {
                $token->delete();
            }

            // Log logout action
            $this->auditLogRepository->create(
                tenantId: $command->tenantId,
                action: 'vendor_logout',
                entityType: 'user',
                entityId: $command->userId,
                userId: (int) $command->userId,
                metadata: [
                    'token_id' => $command->tokenId,
                    'logout_at' => now()->toIso8601String(),
                    'user_agent' => request()->userAgent(),
                ],
                ipAddress: request()->ip()
            );

            return true;
        });
    }

    /**
     * Logout from all devices by revoking all user tokens
     * 
     * @param string $userId
     * @param int $tenantId
     * @return int Number of tokens revoked
     */
    public function logoutFromAllDevices(string $userId, int $tenantId): int
    {
        return DB::transaction(function () use ($userId, $tenantId) {
            // Revoke all tokens for the user
            $count = PersonalAccessToken::where('tokenable_id', (int) $userId)
                ->where('tokenable_type', 'App\Models\User')
                ->delete();

            // Log logout from all devices
            $this->auditLogRepository->create(
                tenantId: $tenantId,
                action: 'vendor_logout_all_devices',
                entityType: 'user',
                entityId: $userId,
                userId: (int) $userId,
                metadata: [
                    'tokens_revoked' => $count,
                    'logout_at' => now()->toIso8601String(),
                    'user_agent' => request()->userAgent(),
                ],
                ipAddress: request()->ip()
            );

            return $count;
        });
    }
}
