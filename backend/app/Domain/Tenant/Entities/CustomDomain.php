<?php

namespace App\Domain\Tenant\Entities;

use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\CustomDomainStatus;
use App\Domain\Tenant\Enums\VerificationMethod;
use App\Domain\Tenant\Enums\DnsProvider;
use App\Domain\Tenant\ValueObjects\DomainName;
use App\Domain\Tenant\ValueObjects\DomainVerificationToken;
use Carbon\Carbon;

class CustomDomain
{
    public function __construct(
        private Uuid $id,
        private Uuid $tenantId,
        private DomainName $domainName,
        private bool $isVerified = false,
        private ?VerificationMethod $verificationMethod = null,
        private ?DomainVerificationToken $verificationToken = null,
        private ?Carbon $verifiedAt = null,
        private bool $sslEnabled = false,
        private ?string $sslCertificatePath = null,
        private ?Carbon $sslCertificateIssuedAt = null,
        private ?Carbon $sslCertificateExpiresAt = null,
        private bool $autoRenewSsl = true,
        private ?DnsProvider $dnsProvider = null,
        private ?string $dnsRecordId = null,
        private ?string $dnsZoneId = null,
        private CustomDomainStatus $status = CustomDomainStatus::PENDING_VERIFICATION,
        private bool $redirectToHttps = true,
        private string $wwwRedirect = 'add_www',
        private array $metadata = [],
        private ?Uuid $createdBy = null,
        private ?Carbon $createdAt = null,
        private ?Carbon $updatedAt = null,
        private ?Carbon $deletedAt = null
    ) {}

    public static function create(
        Uuid $tenantId,
        DomainName $domainName,
        ?Uuid $createdBy = null,
        ?VerificationMethod $verificationMethod = null
    ): self {
        return new self(
            id: Uuid::generate(),
            tenantId: $tenantId,
            domainName: $domainName,
            verificationToken: DomainVerificationToken::generate(),
            verificationMethod: $verificationMethod ?? VerificationMethod::DNS_TXT,
            createdBy: $createdBy,
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

    public function getDomainName(): DomainName
    {
        return $this->domainName;
    }

    public function isVerified(): bool
    {
        return $this->isVerified;
    }

    public function getVerificationMethod(): ?VerificationMethod
    {
        return $this->verificationMethod;
    }

    public function getVerificationToken(): ?DomainVerificationToken
    {
        return $this->verificationToken;
    }

    public function getVerifiedAt(): ?Carbon
    {
        return $this->verifiedAt;
    }

    public function isSslEnabled(): bool
    {
        return $this->sslEnabled;
    }

    public function getSslCertificatePath(): ?string
    {
        return $this->sslCertificatePath;
    }

    public function getSslCertificateIssuedAt(): ?Carbon
    {
        return $this->sslCertificateIssuedAt;
    }

    public function getSslCertificateExpiresAt(): ?Carbon
    {
        return $this->sslCertificateExpiresAt;
    }

    public function shouldAutoRenewSsl(): bool
    {
        return $this->autoRenewSsl;
    }

    public function getDnsProvider(): ?DnsProvider
    {
        return $this->dnsProvider;
    }

    public function getDnsRecordId(): ?string
    {
        return $this->dnsRecordId;
    }

    public function getDnsZoneId(): ?string
    {
        return $this->dnsZoneId;
    }

    public function getStatus(): CustomDomainStatus
    {
        return $this->status;
    }

    public function shouldRedirectToHttps(): bool
    {
        return $this->redirectToHttps;
    }

    public function getWwwRedirect(): string
    {
        return $this->wwwRedirect;
    }

    public function getMetadata(): array
    {
        return $this->metadata;
    }

    public function getCreatedBy(): ?Uuid
    {
        return $this->createdBy;
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

    public function markAsVerified(): void
    {
        if ($this->status->canBeVerified()) {
            $this->isVerified = true;
            $this->verifiedAt = Carbon::now();
            $this->status = CustomDomainStatus::VERIFIED;
            $this->updatedAt = Carbon::now();
        }
    }

    public function activate(): void
    {
        if ($this->status->canBeActivated()) {
            $this->status = CustomDomainStatus::ACTIVE;
            $this->updatedAt = Carbon::now();
        }
    }

    public function suspend(): void
    {
        if ($this->status->canBeSuspended()) {
            $this->status = CustomDomainStatus::SUSPENDED;
            $this->updatedAt = Carbon::now();
        }
    }

    public function markAsFailed(): void
    {
        $this->status = CustomDomainStatus::FAILED;
        $this->updatedAt = Carbon::now();
    }

    public function regenerateVerificationToken(): void
    {
        $this->verificationToken = DomainVerificationToken::generate();
        $this->updatedAt = Carbon::now();
    }

    public function updateVerificationMethod(VerificationMethod $method): void
    {
        $this->verificationMethod = $method;
        $this->updatedAt = Carbon::now();
    }

    public function configureSsl(
        string $certificatePath,
        Carbon $issuedAt,
        Carbon $expiresAt
    ): void {
        $this->sslEnabled = true;
        $this->sslCertificatePath = $certificatePath;
        $this->sslCertificateIssuedAt = $issuedAt;
        $this->sslCertificateExpiresAt = $expiresAt;
        $this->updatedAt = Carbon::now();
    }

    public function disableSsl(): void
    {
        $this->sslEnabled = false;
        $this->updatedAt = Carbon::now();
    }

    public function updateDnsConfiguration(
        DnsProvider $provider,
        ?string $recordId = null,
        ?string $zoneId = null
    ): void {
        $this->dnsProvider = $provider;
        $this->dnsRecordId = $recordId;
        $this->dnsZoneId = $zoneId;
        $this->updatedAt = Carbon::now();
    }

    public function updateMetadata(array $metadata): void
    {
        $this->metadata = array_merge($this->metadata, $metadata);
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

    public function isOperational(): bool
    {
        return $this->status->isOperational() && !$this->isDeleted();
    }

    public function isSslExpiringSoon(int $days = 30): bool
    {
        if (!$this->sslEnabled || !$this->sslCertificateExpiresAt) {
            return false;
        }

        return $this->sslCertificateExpiresAt->lte(Carbon::now()->addDays($days));
    }
}
