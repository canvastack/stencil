<?php

namespace App\Domain\Tenant\Entities;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Tenant\ValueObjects\DomainName;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\Enums\DomainStatus;
use DateTime;
use InvalidArgumentException;

class DomainMapping
{
    private UuidValueObject $id;
    private UuidValueObject $tenantId;
    private DomainName $domain;
    private ?SubdomainName $subdomain;
    private bool $isPrimary;
    private bool $sslEnabled;
    private ?string $sslCertificatePath;
    private DomainStatus $status;
    private ?array $dnsRecords;
    private ?DateTime $verifiedAt;
    private DateTime $createdAt;
    private DateTime $updatedAt;

    public function __construct(
        UuidValueObject $id,
        UuidValueObject $tenantId,
        DomainName $domain,
        ?SubdomainName $subdomain = null,
        bool $isPrimary = false,
        bool $sslEnabled = false,
        ?string $sslCertificatePath = null,
        DomainStatus $status = DomainStatus::PENDING,
        ?array $dnsRecords = null,
        ?DateTime $verifiedAt = null,
        ?DateTime $createdAt = null,
        ?DateTime $updatedAt = null
    ) {
        $this->id = $id;
        $this->tenantId = $tenantId;
        $this->domain = $domain;
        $this->subdomain = $subdomain;
        $this->isPrimary = $isPrimary;
        $this->sslEnabled = $sslEnabled;
        $this->sslCertificatePath = $sslCertificatePath;
        $this->status = $status;
        $this->dnsRecords = $dnsRecords;
        $this->verifiedAt = $verifiedAt;
        $this->createdAt = $createdAt ?? new DateTime();
        $this->updatedAt = $updatedAt ?? new DateTime();

        $this->validateSslConfiguration();
    }

    public function getId(): UuidValueObject
    {
        return $this->id;
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getDomain(): DomainName
    {
        return $this->domain;
    }

    public function getSubdomain(): ?SubdomainName
    {
        return $this->subdomain;
    }

    public function isPrimary(): bool
    {
        return $this->isPrimary;
    }

    public function isSslEnabled(): bool
    {
        return $this->sslEnabled;
    }

    public function getSslCertificatePath(): ?string
    {
        return $this->sslCertificatePath;
    }

    public function getStatus(): DomainStatus
    {
        return $this->status;
    }

    public function getDnsRecords(): ?array
    {
        return $this->dnsRecords;
    }

    public function getVerifiedAt(): ?DateTime
    {
        return $this->verifiedAt;
    }

    public function getCreatedAt(): DateTime
    {
        return $this->createdAt;
    }

    public function getUpdatedAt(): DateTime
    {
        return $this->updatedAt;
    }

    public function getFullDomain(): string
    {
        if ($this->subdomain) {
            return $this->subdomain->getValue() . '.' . $this->domain->getValue();
        }

        return $this->domain->getValue();
    }

    public function isActive(): bool
    {
        return $this->status === DomainStatus::ACTIVE;
    }

    public function isVerified(): bool
    {
        return $this->verifiedAt !== null && $this->status === DomainStatus::ACTIVE;
    }

    public function setPrimary(bool $isPrimary): self
    {
        $this->isPrimary = $isPrimary;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function enableSsl(string $certificatePath): self
    {
        if (empty($certificatePath)) {
            throw new InvalidArgumentException('SSL certificate path cannot be empty');
        }

        $this->sslEnabled = true;
        $this->sslCertificatePath = $certificatePath;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function disableSsl(): self
    {
        $this->sslEnabled = false;
        $this->sslCertificatePath = null;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function updateStatus(DomainStatus $status): self
    {
        $this->status = $status;
        $this->updatedAt = new DateTime();

        if ($status === DomainStatus::ACTIVE && $this->verifiedAt === null) {
            $this->verifiedAt = new DateTime();
        }
        
        return $this;
    }

    public function updateDnsRecords(array $dnsRecords): self
    {
        $this->dnsRecords = $dnsRecords;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function markAsVerified(): self
    {
        $this->verifiedAt = new DateTime();
        $this->status = DomainStatus::ACTIVE;
        $this->updatedAt = new DateTime();
        
        return $this;
    }

    public function getRequiredDnsRecords(): array
    {
        return [
            [
                'type' => 'A',
                'name' => '@',
                'value' => config('app.server_ip', '127.0.0.1'),
                'ttl' => 300
            ],
            [
                'type' => 'CNAME',
                'name' => 'www',
                'value' => $this->domain->getValue(),
                'ttl' => 300
            ]
        ];
    }

    public function generateSslUrl(string $path = ''): string
    {
        $protocol = $this->sslEnabled ? 'https' : 'http';
        $fullDomain = $this->getFullDomain();
        $path = ltrim($path, '/');
        
        return $protocol . '://' . $fullDomain . '/' . $path;
    }

    private function validateSslConfiguration(): void
    {
        if ($this->sslEnabled && empty($this->sslCertificatePath)) {
            throw new InvalidArgumentException('SSL certificate path is required when SSL is enabled');
        }
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id->getValue(),
            'tenant_id' => $this->tenantId->getValue(),
            'domain' => $this->domain->getValue(),
            'subdomain' => $this->subdomain?->getValue(),
            'is_primary' => $this->isPrimary,
            'ssl_enabled' => $this->sslEnabled,
            'ssl_certificate_path' => $this->sslCertificatePath,
            'status' => $this->status->value,
            'dns_records' => $this->dnsRecords,
            'verified_at' => $this->verifiedAt?->format('Y-m-d H:i:s'),
            'created_at' => $this->createdAt->format('Y-m-d H:i:s'),
            'updated_at' => $this->updatedAt->format('Y-m-d H:i:s'),
        ];
    }
}