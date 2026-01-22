<?php

namespace App\Domain\Tenant\Exceptions;

use DomainException;

class TenantNotFoundException extends DomainException
{
    public static function forSubdomain(string $subdomain): self
    {
        return new self("Tenant not found for subdomain: {$subdomain}");
    }

    public static function forPath(string $path): self
    {
        return new self("Tenant not found for path: {$path}");
    }

    public static function forCustomDomain(string $domain): self
    {
        return new self("Tenant not found for custom domain: {$domain}");
    }

    public static function forId(string $id): self
    {
        return new self("Tenant not found for ID: {$id}");
    }

    public static function inactive(string $identifier): self
    {
        return new self("Tenant is inactive: {$identifier}");
    }
}
