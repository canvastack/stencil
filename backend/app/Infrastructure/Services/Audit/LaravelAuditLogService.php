<?php

declare(strict_types=1);

namespace App\Infrastructure\Services\Audit;

use App\Domain\Audit\Repositories\AuditLogRepositoryInterface;
use Illuminate\Support\Facades\Log;

/**
 * Laravel Audit Log Service
 * 
 * Implementation of AuditLogServiceInterface using AuditLogRepository.
 * Automatically captures IP address, user agent, and timestamps for all audit events.
 * 
 * Business Rules:
 * - All vendor actions are logged for compliance
 * - IP address and user agent captured automatically
 * - Failed login attempts tracked for security
 * - Audit logs are immutable (no updates/deletes)
 * - Tenant-scoped for data isolation
 */
class LaravelAuditLogService implements AuditLogServiceInterface
{
    public function __construct(
        private AuditLogRepositoryInterface $auditLogRepository
    ) {}

    /**
     * Log vendor login event
     */
    public function logVendorLogin(int $tenantId, int $userId, string $vendorUuid, array $metadata = []): void
    {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'vendor.login',
                'vendor',
                $vendorUuid,
                $userId,
                array_merge($metadata, [
                    'login_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ]),
                $this->getIpAddress()
            );

            Log::info('Vendor login logged', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'vendor_uuid' => $vendorUuid
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log vendor login', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log failed login attempt
     */
    public function logFailedLogin(int $tenantId, string $email, string $reason, array $metadata = []): void
    {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'vendor.login.failed',
                'authentication',
                $email,
                null,
                array_merge($metadata, [
                    'email' => $email,
                    'reason' => $reason,
                    'attempted_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ]),
                $this->getIpAddress()
            );

            Log::warning('Failed login attempt logged', [
                'tenant_id' => $tenantId,
                'email' => $email,
                'reason' => $reason
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log failed login', [
                'tenant_id' => $tenantId,
                'email' => $email,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log vendor logout event
     */
    public function logVendorLogout(int $tenantId, int $userId, string $vendorUuid, bool $allDevices = false): void
    {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'vendor.logout',
                'vendor',
                $vendorUuid,
                $userId,
                [
                    'all_devices' => $allDevices,
                    'logout_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ],
                $this->getIpAddress()
            );

            Log::info('Vendor logout logged', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'vendor_uuid' => $vendorUuid,
                'all_devices' => $allDevices
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log vendor logout', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log quote response action
     */
    public function logQuoteResponse(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $responseType,
        array $oldValues,
        array $newValues
    ): void {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                "quote.{$responseType}",
                'quote',
                $quoteUuid,
                $userId,
                [
                    'response_type' => $responseType,
                    'responded_at' => now()->toIso8601String(),
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'user_agent' => $this->getUserAgent(),
                ],
                $this->getIpAddress()
            );

            Log::info('Quote response logged', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'quote_uuid' => $quoteUuid,
                'response_type' => $responseType
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log quote response', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'quote_uuid' => $quoteUuid,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log vendor profile update
     */
    public function logProfileUpdate(
        int $tenantId,
        int $userId,
        string $vendorUuid,
        array $oldValues,
        array $newValues
    ): void {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'vendor.profile.update',
                'vendor',
                $vendorUuid,
                $userId,
                [
                    'updated_at' => now()->toIso8601String(),
                    'changed_fields' => array_keys($newValues),
                    'old_values' => $oldValues,
                    'new_values' => $newValues,
                    'user_agent' => $this->getUserAgent(),
                ],
                $this->getIpAddress()
            );

            Log::info('Profile update logged', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'vendor_uuid' => $vendorUuid,
                'changed_fields' => array_keys($newValues)
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log profile update', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'vendor_uuid' => $vendorUuid,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log quote message sent
     */
    public function logMessageSend(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $messageUuid,
        bool $hasAttachments = false
    ): void {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'quote.message.send',
                'quote_message',
                $messageUuid,
                $userId,
                [
                    'quote_uuid' => $quoteUuid,
                    'has_attachments' => $hasAttachments,
                    'sent_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ],
                $this->getIpAddress()
            );

            Log::info('Message send logged', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'quote_uuid' => $quoteUuid,
                'message_uuid' => $messageUuid
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log message send', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log password reset request
     */
    public function logPasswordResetRequest(int $tenantId, string $email): void
    {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'vendor.password.reset.request',
                'authentication',
                $email,
                null,
                [
                    'email' => $email,
                    'requested_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ],
                $this->getIpAddress()
            );

            Log::info('Password reset request logged', [
                'tenant_id' => $tenantId,
                'email' => $email
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log password reset request', [
                'tenant_id' => $tenantId,
                'email' => $email,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log password reset completion
     */
    public function logPasswordReset(int $tenantId, int $userId, string $email): void
    {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'vendor.password.reset',
                'authentication',
                $email,
                $userId,
                [
                    'email' => $email,
                    'reset_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ],
                $this->getIpAddress()
            );

            Log::info('Password reset logged', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'email' => $email
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log password reset', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log vendor onboarding event
     */
    public function logVendorOnboarding(
        int $tenantId,
        int $adminUserId,
        string $vendorUuid,
        string $vendorEmail
    ): void {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                'vendor.onboarding.initiated',
                'vendor',
                $vendorUuid,
                $adminUserId,
                [
                    'vendor_email' => $vendorEmail,
                    'initiated_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ],
                $this->getIpAddress()
            );

            Log::info('Vendor onboarding logged', [
                'tenant_id' => $tenantId,
                'admin_user_id' => $adminUserId,
                'vendor_uuid' => $vendorUuid
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log vendor onboarding', [
                'tenant_id' => $tenantId,
                'admin_user_id' => $adminUserId,
                'vendor_uuid' => $vendorUuid,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Log generic vendor action
     */
    public function logAction(
        int $tenantId,
        int $userId,
        string $actionType,
        string $resourceType,
        string $resourceId,
        array $metadata = []
    ): void {
        try {
            $this->auditLogRepository->create(
                $tenantId,
                $actionType,
                $resourceType,
                $resourceId,
                $userId,
                array_merge($metadata, [
                    'action_at' => now()->toIso8601String(),
                    'user_agent' => $this->getUserAgent(),
                ]),
                $this->getIpAddress()
            );

            Log::info('Vendor action logged', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'action_type' => $actionType,
                'resource_type' => $resourceType
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to log vendor action', [
                'tenant_id' => $tenantId,
                'user_id' => $userId,
                'action_type' => $actionType,
                'error' => $e->getMessage()
            ]);
        }
    }

    /**
     * Get client IP address
     * 
     * @return string
     */
    private function getIpAddress(): string
    {
        return request()->ip() ?? 'unknown';
    }

    /**
     * Get client user agent
     * 
     * @return string
     */
    private function getUserAgent(): string
    {
        return request()->userAgent() ?? 'unknown';
    }
}
