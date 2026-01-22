<?php

namespace App\Domain\TenantConfiguration\Services;

interface SSLProviderInterface
{
    public function provisionCertificate(
        string $domainName,
        string $email
    ): array;

    public function renewCertificate(
        string $domainName,
        string $email
    ): array;

    public function revokeCertificate(
        string $domainName
    ): bool;

    public function getCertificateInfo(
        string $domainName
    ): ?array;

    public function verifyConnection(): bool;
}
