<?php

declare(strict_types=1);

namespace App\Infrastructure\Services\Audit;

/**
 * Audit Log Service Interface
 * 
 * Defines contract for audit logging operations in the vendor portal.
 * Automatically captures IP address, user agent, and timestamps.
 */
interface AuditLogServiceInterface
{
    /**
     * Log vendor login event
     * 
     * @param int $tenantId
     * @param int $userId
     * @param string $vendorUuid
     * @param array $metadata Additional context data
     * @return void
     */
    public function logVendorLogin(int $tenantId, int $userId, string $vendorUuid, array $metadata = []): void;

    /**
     * Log failed login attempt
     * 
     * @param int $tenantId
     * @param string $email
     * @param string $reason Failure reason (invalid_credentials, account_locked, etc.)
     * @param array $metadata Additional context data
     * @return void
     */
    public function logFailedLogin(int $tenantId, string $email, string $reason, array $metadata = []): void;

    /**
     * Log vendor logout event
     * 
     * @param int $tenantId
     * @param int $userId
     * @param string $vendorUuid
     * @param bool $allDevices Whether logout was from all devices
     * @return void
     */
    public function logVendorLogout(int $tenantId, int $userId, string $vendorUuid, bool $allDevices = false): void;

    /**
     * Log quote response action (accept, reject, counter)
     * 
     * @param int $tenantId
     * @param int $userId
     * @param string $quoteUuid
     * @param string $responseType 'accepted', 'rejected', or 'countered'
     * @param array $oldValues Previous quote state
     * @param array $newValues New quote state
     * @return void
     */
    public function logQuoteResponse(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $responseType,
        array $oldValues,
        array $newValues
    ): void;

    /**
     * Log vendor profile update
     * 
     * @param int $tenantId
     * @param int $userId
     * @param string $vendorUuid
     * @param array $oldValues Previous profile data
     * @param array $newValues Updated profile data
     * @return void
     */
    public function logProfileUpdate(
        int $tenantId,
        int $userId,
        string $vendorUuid,
        array $oldValues,
        array $newValues
    ): void;

    /**
     * Log quote message sent
     * 
     * @param int $tenantId
     * @param int $userId
     * @param string $quoteUuid
     * @param string $messageUuid
     * @param bool $hasAttachments
     * @return void
     */
    public function logMessageSend(
        int $tenantId,
        int $userId,
        string $quoteUuid,
        string $messageUuid,
        bool $hasAttachments = false
    ): void;

    /**
     * Log password reset request
     * 
     * @param int $tenantId
     * @param string $email
     * @return void
     */
    public function logPasswordResetRequest(int $tenantId, string $email): void;

    /**
     * Log password reset completion
     * 
     * @param int $tenantId
     * @param int $userId
     * @param string $email
     * @return void
     */
    public function logPasswordReset(int $tenantId, int $userId, string $email): void;

    /**
     * Log vendor onboarding event
     * 
     * @param int $tenantId
     * @param int $adminUserId Admin who initiated onboarding
     * @param string $vendorUuid
     * @param string $vendorEmail
     * @return void
     */
    public function logVendorOnboarding(
        int $tenantId,
        int $adminUserId,
        string $vendorUuid,
        string $vendorEmail
    ): void;

    /**
     * Log generic vendor action
     * 
     * @param int $tenantId
     * @param int $userId
     * @param string $actionType Action identifier (e.g., 'vendor.profile.view')
     * @param string $resourceType Resource type (e.g., 'vendor', 'quote')
     * @param string $resourceId Resource UUID
     * @param array $metadata Additional context data
     * @return void
     */
    public function logAction(
        int $tenantId,
        int $userId,
        string $actionType,
        string $resourceType,
        string $resourceId,
        array $metadata = []
    ): void;
}
