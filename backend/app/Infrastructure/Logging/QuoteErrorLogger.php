<?php

declare(strict_types=1);

namespace App\Infrastructure\Logging;

use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Quote Error Logger
 * 
 * Centralized error logging for quote-related operations.
 * Provides structured logging with context for monitoring and debugging.
 * 
 * Log Levels:
 * - ERROR: Critical failures that prevent operation completion
 * - WARNING: Non-critical issues that don't prevent operation
 * - INFO: Successful operations with important context
 * 
 * Context Fields:
 * - user_id: Authenticated user ID
 * - tenant_id: Tenant ID for multi-tenant isolation
 * - quote_uuid: Quote identifier
 * - timestamp: ISO 8601 timestamp
 * - error_class: Exception class name
 * - trace: Stack trace for debugging
 */
class QuoteErrorLogger
{
    /**
     * Log API error with full context
     * 
     * @param string $operation Operation name (e.g., 'create_quote', 'update_status')
     * @param Throwable $exception Exception that occurred
     * @param array $context Additional context data
     * @return void
     */
    public static function logApiError(string $operation, Throwable $exception, array $context = []): void
    {
        Log::error("Quote API error: {$operation}", array_merge([
            'operation' => $operation,
            'error' => $exception->getMessage(),
            'error_class' => get_class($exception),
            'error_code' => $exception->getCode(),
            'file' => $exception->getFile(),
            'line' => $exception->getLine(),
            'trace' => $exception->getTraceAsString(),
            'user_id' => auth()->id(),
            'tenant_id' => auth()->user()->tenant_id ?? null,
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log failed email notification
     * 
     * @param string $quoteUuid Quote UUID
     * @param string $recipientEmail Recipient email address
     * @param string $notificationType Type of notification (e.g., 'quote_received', 'quote_response')
     * @param Throwable $exception Exception that occurred
     * @param int $attemptNumber Retry attempt number
     * @return void
     */
    public static function logEmailFailure(
        string $quoteUuid,
        string $recipientEmail,
        string $notificationType,
        Throwable $exception,
        int $attemptNumber = 1
    ): void {
        Log::error('Quote email notification failed', [
            'quote_uuid' => $quoteUuid,
            'recipient_email' => $recipientEmail,
            'notification_type' => $notificationType,
            'attempt_number' => $attemptNumber,
            'error' => $exception->getMessage(),
            'error_class' => get_class($exception),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Log tenant isolation violation
     * 
     * @param string $operation Operation that was attempted
     * @param string $resourceType Type of resource (e.g., 'quote', 'order')
     * @param string $resourceId Resource identifier (UUID or ID)
     * @param int $requestedTenantId Tenant ID from request
     * @param int $actualTenantId Actual tenant ID of resource
     * @return void
     */
    public static function logTenantIsolationViolation(
        string $operation,
        string $resourceType,
        string $resourceId,
        int $requestedTenantId,
        int $actualTenantId
    ): void {
        Log::error('Tenant isolation violation detected', [
            'operation' => $operation,
            'resource_type' => $resourceType,
            'resource_id' => $resourceId,
            'requested_tenant_id' => $requestedTenantId,
            'actual_tenant_id' => $actualTenantId,
            'user_id' => auth()->id(),
            'user_email' => auth()->user()->email ?? null,
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Log validation error
     * 
     * @param string $operation Operation that failed validation
     * @param array $errors Validation errors
     * @param array $context Additional context
     * @return void
     */
    public static function logValidationError(string $operation, array $errors, array $context = []): void
    {
        Log::warning("Quote validation error: {$operation}", array_merge([
            'operation' => $operation,
            'validation_errors' => $errors,
            'user_id' => auth()->id(),
            'tenant_id' => auth()->user()->tenant_id ?? null,
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log successful operation with context
     * 
     * @param string $operation Operation name
     * @param string $quoteUuid Quote UUID
     * @param array $context Additional context
     * @return void
     */
    public static function logSuccess(string $operation, string $quoteUuid, array $context = []): void
    {
        Log::info("Quote operation successful: {$operation}", array_merge([
            'operation' => $operation,
            'quote_uuid' => $quoteUuid,
            'user_id' => auth()->id(),
            'tenant_id' => auth()->user()->tenant_id ?? null,
            'timestamp' => now()->toIso8601String(),
        ], $context));
    }

    /**
     * Log status transition
     * 
     * @param string $quoteUuid Quote UUID
     * @param string $fromStatus Previous status
     * @param string $toStatus New status
     * @param string|null $reason Reason for transition
     * @return void
     */
    public static function logStatusTransition(
        string $quoteUuid,
        string $fromStatus,
        string $toStatus,
        ?string $reason = null
    ): void {
        Log::info('Quote status transition', [
            'quote_uuid' => $quoteUuid,
            'from_status' => $fromStatus,
            'to_status' => $toStatus,
            'reason' => $reason,
            'user_id' => auth()->id(),
            'tenant_id' => auth()->user()->tenant_id ?? null,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Log quote expiration
     * 
     * @param string $quoteUuid Quote UUID
     * @param string $vendorName Vendor name
     * @param string $expiresAt Expiration date
     * @return void
     */
    public static function logQuoteExpiration(
        string $quoteUuid,
        string $vendorName,
        string $expiresAt
    ): void {
        Log::info('Quote expired', [
            'quote_uuid' => $quoteUuid,
            'vendor_name' => $vendorName,
            'expires_at' => $expiresAt,
            'timestamp' => now()->toIso8601String(),
        ]);
    }

    /**
     * Log database query error
     * 
     * @param string $operation Operation that failed
     * @param Throwable $exception Exception that occurred
     * @param array $queryContext Query context (table, conditions, etc.)
     * @return void
     */
    public static function logDatabaseError(
        string $operation,
        Throwable $exception,
        array $queryContext = []
    ): void {
        Log::error("Quote database error: {$operation}", array_merge([
            'operation' => $operation,
            'error' => $exception->getMessage(),
            'error_class' => get_class($exception),
            'error_code' => $exception->getCode(),
            'user_id' => auth()->id(),
            'tenant_id' => auth()->user()->tenant_id ?? null,
            'timestamp' => now()->toIso8601String(),
        ], $queryContext));
    }
}
