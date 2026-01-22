<?php

namespace App\Domain\Tenant\Services;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Entities\Tenant;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\Exceptions\TenantNotFoundException;
use App\Domain\Tenant\Repositories\TenantRepositoryInterface;
use App\Domain\Tenant\Repositories\TenantUrlConfigRepositoryInterface;
use App\Domain\Tenant\Repositories\CustomDomainRepositoryInterface;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\ValueObjects\UrlPath;
use App\Domain\Tenant\ValueObjects\DomainName;

class TenantResolver
{
    public function __construct(
        private TenantRepositoryInterface $tenantRepository,
        private TenantUrlConfigRepositoryInterface $urlConfigRepository,
        private CustomDomainRepositoryInterface $customDomainRepository
    ) {}

    public function resolve(UrlPattern $pattern, string $identifier): Tenant
    {
        return match ($pattern) {
            UrlPattern::SUBDOMAIN => $this->resolveBySubdomain($identifier),
            UrlPattern::PATH => $this->resolveByPath($identifier),
            UrlPattern::CUSTOM_DOMAIN => $this->resolveByCustomDomain($identifier),
        };
    }

    public function resolveTenantData(UrlPattern $pattern, string $identifier): array
    {
        $tenant = $this->resolve($pattern, $identifier);

        return [
            'id' => $tenant->getId()->getValue(),
            'uuid' => $tenant->getId()->toString(),
            'slug' => $tenant->getSlug()->getValue(),
            'name' => $tenant->getName()->getValue(),
            'status' => $tenant->getStatus()->value,
            'is_active' => $tenant->isActive(),
        ];
    }

    private function resolveBySubdomain(string $subdomain): Tenant
    {
        $subdomainName = new SubdomainName($subdomain);
        $urlConfig = $this->urlConfigRepository->findBySubdomain($subdomainName);

        if (!$urlConfig) {
            throw new TenantNotFoundException(
                "No tenant found for subdomain: {$subdomain}"
            );
        }

        if (!$urlConfig->isActive()) {
            throw new TenantNotFoundException(
                "Tenant URL configuration is inactive for subdomain: {$subdomain}"
            );
        }

        return $this->tenantRepository->findById($urlConfig->getTenantId());
    }

    private function resolveByPath(string $slug): Tenant
    {
        $urlPath = new UrlPath($slug);
        $urlConfig = $this->urlConfigRepository->findByUrlPath($urlPath);

        if (!$urlConfig) {
            throw new TenantNotFoundException(
                "No tenant found for path: {$slug}"
            );
        }

        if (!$urlConfig->isActive()) {
            throw new TenantNotFoundException(
                "Tenant URL configuration is inactive for path: {$slug}"
            );
        }

        return $this->tenantRepository->findById($urlConfig->getTenantId());
    }

    private function resolveByCustomDomain(string $domain): Tenant
    {
        $domainName = new DomainName($domain);
        $customDomain = $this->customDomainRepository->findByDomain($domainName);

        if (!$customDomain) {
            throw new TenantNotFoundException(
                "No tenant found for custom domain: {$domain}"
            );
        }

        if (!$customDomain->isVerified()) {
            throw new TenantNotFoundException(
                "Custom domain not verified: {$domain}"
            );
        }

        if (!$customDomain->getStatus()->isOperational()) {
            throw new TenantNotFoundException(
                "Custom domain is not active: {$domain}"
            );
        }

        $urlConfig = $this->urlConfigRepository->findByCustomDomainId($customDomain->getId());

        if (!$urlConfig) {
            throw new TenantNotFoundException(
                "No URL configuration found for custom domain: {$domain}"
            );
        }

        return $this->tenantRepository->findById($urlConfig->getTenantId());
    }

    public function validateTenantAccess(Tenant $tenant): void
    {
        if (!$tenant->isActive()) {
            throw new TenantNotFoundException(
                "Tenant is not active: {$tenant->getSlug()->getValue()}"
            );
        }
    }
}
