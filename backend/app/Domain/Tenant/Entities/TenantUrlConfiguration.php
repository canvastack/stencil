<?php

namespace App\Domain\Tenant\Entities;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\ValueObjects\UrlPath;
use Carbon\Carbon;

class TenantUrlConfiguration
{
    public function __construct(
        private Uuid $id,
        private Uuid $tenantId,
        private UrlPattern $urlPattern,
        private bool $isPrimary = false,
        private bool $isEnabled = true,
        private ?SubdomainName $subdomain = null,
        private ?UrlPath $urlPath = null,
        private ?Uuid $customDomainId = null,
        private bool $forceHttps = true,
        private bool $redirectToPrimary = false,
        private ?string $metaTitle = null,
        private ?string $metaDescription = null,
        private ?string $ogImageUrl = null,
        private ?Carbon $createdAt = null,
        private ?Carbon $updatedAt = null,
        private ?Carbon $deletedAt = null
    ) {}

    public static function create(
        Uuid $tenantId,
        UrlPattern $urlPattern,
        ?SubdomainName $subdomain = null,
        ?UrlPath $urlPath = null,
        ?Uuid $customDomainId = null,
        bool $isPrimary = false
    ): self {
        return new self(
            id: Uuid::generate(),
            tenantId: $tenantId,
            urlPattern: $urlPattern,
            subdomain: $subdomain,
            urlPath: $urlPath,
            customDomainId: $customDomainId,
            isPrimary: $isPrimary,
            createdAt: Carbon::now()
        );
    }

    public function getId(): Uuid
    {
        return $this->id;
    }

    public function getTenantId(): Uuid
    {
        return $this->tenantId;
    }

    public function getUrlPattern(): UrlPattern
    {
        return $this->urlPattern;
    }

    public function isPrimary(): bool
    {
        return $this->isPrimary;
    }

    public function isEnabled(): bool
    {
        return $this->isEnabled;
    }

    public function getSubdomain(): ?SubdomainName
    {
        return $this->subdomain;
    }

    public function getUrlPath(): ?UrlPath
    {
        return $this->urlPath;
    }

    public function getCustomDomainId(): ?Uuid
    {
        return $this->customDomainId;
    }

    public function forceHttps(): bool
    {
        return $this->forceHttps;
    }

    public function shouldRedirectToPrimary(): bool
    {
        return $this->redirectToPrimary;
    }

    public function getMetaTitle(): ?string
    {
        return $this->metaTitle;
    }

    public function getMetaDescription(): ?string
    {
        return $this->metaDescription;
    }

    public function getOgImageUrl(): ?string
    {
        return $this->ogImageUrl;
    }

    public function getCreatedAt(): ?Carbon
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): ?Carbon
    {
        return $this->updatedAt;
    }

    public function getDeletedAt(): ?Carbon
    {
        return $this->deletedAt;
    }

    public function markAsPrimary(): void
    {
        $this->isPrimary = true;
        $this->updatedAt = Carbon::now();
    }

    public function unmarkAsPrimary(): void
    {
        $this->isPrimary = false;
        $this->updatedAt = Carbon::now();
    }

    public function enable(): void
    {
        $this->isEnabled = true;
        $this->updatedAt = Carbon::now();
    }

    public function disable(): void
    {
        $this->isEnabled = false;
        $this->updatedAt = Carbon::now();
    }

    public function updateSeoMetadata(?string $metaTitle, ?string $metaDescription, ?string $ogImageUrl): void
    {
        $this->metaTitle = $metaTitle;
        $this->metaDescription = $metaDescription;
        $this->ogImageUrl = $ogImageUrl;
        $this->updatedAt = Carbon::now();
    }

    public function enableHttpsRedirect(): void
    {
        $this->forceHttps = true;
        $this->updatedAt = Carbon::now();
    }

    public function disableHttpsRedirect(): void
    {
        $this->forceHttps = false;
        $this->updatedAt = Carbon::now();
    }

    public function enableRedirectToPrimary(): void
    {
        $this->redirectToPrimary = true;
        $this->updatedAt = Carbon::now();
    }

    public function disableRedirectToPrimary(): void
    {
        $this->redirectToPrimary = false;
        $this->updatedAt = Carbon::now();
    }

    public function delete(): void
    {
        $this->deletedAt = Carbon::now();
        $this->updatedAt = Carbon::now();
    }

    public function restore(): void
    {
        $this->deletedAt = null;
        $this->updatedAt = Carbon::now();
    }

    public function isDeleted(): bool
    {
        return $this->deletedAt !== null;
    }

    public function isActive(): bool
    {
        return $this->isEnabled && !$this->isDeleted();
    }

    public function getAccessUrl(string $baseDomain = 'stencil.canvastack.com'): string
    {
        return match ($this->urlPattern) {
            UrlPattern::SUBDOMAIN => 'https://' . $this->subdomain . '.' . $baseDomain,
            UrlPattern::PATH => 'https://' . $baseDomain . '/' . $this->urlPath,
            UrlPattern::CUSTOM_DOMAIN => 'https://[custom-domain]',
        };
    }
}
