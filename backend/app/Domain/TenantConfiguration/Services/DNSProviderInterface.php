<?php

namespace App\Domain\TenantConfiguration\Services;

interface DNSProviderInterface
{
    public function createTxtRecord(
        string $zoneId,
        string $name,
        string $content,
        int $ttl = 300
    ): array;

    public function createCnameRecord(
        string $zoneId,
        string $name,
        string $target,
        int $ttl = 300
    ): array;

    public function createARecord(
        string $zoneId,
        string $name,
        string $ipAddress,
        int $ttl = 300
    ): array;

    public function updateRecord(
        string $zoneId,
        string $recordId,
        array $data
    ): array;

    public function deleteRecord(
        string $zoneId,
        string $recordId
    ): array;

    public function getRecord(
        string $zoneId,
        string $recordId
    ): array;

    public function listRecords(
        string $zoneId,
        ?string $type = null,
        ?string $name = null
    ): array;

    public function getZoneByDomain(string $domain): array;

    public function listZones(): array;

    public function verifyConnection(): bool;
}
