<?php

declare(strict_types=1);

namespace App\Domain\Quote\Exceptions;

use DomainException;

/**
 * TenantIsolationException
 * 
 * Thrown when attempting to access a resource that belongs to a different tenant.
 * This exception enforces multi-tenant data isolation and security.
 * 
 * HTTP Status: 403 Forbidden
 * 
 * Example scenarios:
 * - User tries to access a quote from another tenant
 * - Admin tries to modify data outside their tenant scope
 * - API request attempts cross-tenant data access
 */
class TenantIsolationException extends DomainException
{
    public function __construct(string $message = 'Access denied: resource belongs to different tenant')
    {
        parent::__construct($message, 403);
    }
    
    /**
     * Create exception for quote access violation
     */
    public static function forQuote(string $quoteId, int $requestedTenantId, int $actualTenantId): self
    {
        return new self(
            "Access denied: Quote {$quoteId} belongs to tenant {$actualTenantId}, but request is from tenant {$requestedTenantId}"
        );
    }
    
    /**
     * Create exception for generic resource access violation
     */
    public static function forResource(string $resourceType, string $resourceId): self
    {
        return new self(
            "Access denied: {$resourceType} {$resourceId} belongs to a different tenant"
        );
    }
}
