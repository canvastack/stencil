<?php

namespace App\Application\TenantConfiguration\Services;

use App\Domain\Tenant\Enums\VerificationMethod;
use App\Domain\Tenant\Exceptions\DomainVerificationException;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use App\Infrastructure\Persistence\Eloquent\DomainVerificationLogEloquentModel;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DomainVerificationService
{
    private const DNS_TXT_TIMEOUT = 5;
    private const DNS_CNAME_TIMEOUT = 5;
    private const FILE_UPLOAD_TIMEOUT = 10;
    private const MAX_RETRY_ATTEMPTS = 3;

    public function verifyDomain(CustomDomainEloquentModel $domain): array
    {
        Log::info('[DomainVerificationService] Starting domain verification', [
            'domain_uuid' => $domain->uuid,
            'domain_name' => $domain->domain_name,
            'verification_method' => $domain->verification_method,
        ]);

        try {
            $result = match ($domain->verification_method) {
                'dns_txt' => $this->verifyDnsTxt($domain),
                'dns_cname' => $this->verifyDnsCname($domain),
                'file_upload' => $this->verifyFileUpload($domain),
                default => throw new DomainVerificationException('Invalid verification method'),
            };

            $this->logVerificationAttempt($domain, $result);

            return $result;
        } catch (\Throwable $e) {
            $result = [
                'success' => false,
                'method' => $domain->verification_method,
                'error' => $e->getMessage(),
                'dns_records_found' => [],
            ];

            $this->logVerificationAttempt($domain, $result);

            throw new DomainVerificationException(
                "Domain verification failed: {$e->getMessage()}",
                previous: $e
            );
        }
    }

    public function verifyDnsTxt(CustomDomainEloquentModel $domain): array
    {
        $recordName = '_canva-verify.' . $domain->domain_name;
        $expectedValue = $domain->verification_token;

        try {
            $records = $this->getDnsTxtRecords($recordName);

            Log::debug('[DomainVerificationService] DNS TXT records found', [
                'domain' => $domain->domain_name,
                'record_name' => $recordName,
                'records_count' => count($records),
                'records' => $records,
            ]);

            foreach ($records as $record) {
                if (trim($record) === $expectedValue) {
                    return [
                        'success' => true,
                        'method' => 'dns_txt',
                        'dns_records_found' => $records,
                        'matched_record' => $record,
                    ];
                }
            }

            return [
                'success' => false,
                'method' => 'dns_txt',
                'error' => 'Verification token not found in DNS TXT records',
                'expected_value' => $expectedValue,
                'dns_records_found' => $records,
            ];
        } catch (\Throwable $e) {
            throw new DomainVerificationException(
                "DNS TXT lookup failed: {$e->getMessage()}",
                previous: $e
            );
        }
    }

    public function verifyDnsCname(CustomDomainEloquentModel $domain): array
    {
        $recordName = '_canva-verify.' . $domain->domain_name;
        $expectedValue = $domain->verification_token . '.verify.canvastack.com';

        try {
            $records = $this->getDnsCnameRecords($recordName);

            Log::debug('[DomainVerificationService] DNS CNAME records found', [
                'domain' => $domain->domain_name,
                'record_name' => $recordName,
                'records_count' => count($records),
                'records' => $records,
            ]);

            foreach ($records as $record) {
                if (trim(rtrim($record, '.')) === rtrim($expectedValue, '.')) {
                    return [
                        'success' => true,
                        'method' => 'dns_cname',
                        'dns_records_found' => $records,
                        'matched_record' => $record,
                    ];
                }
            }

            return [
                'success' => false,
                'method' => 'dns_cname',
                'error' => 'Verification token not found in DNS CNAME records',
                'expected_value' => $expectedValue,
                'dns_records_found' => $records,
            ];
        } catch (\Throwable $e) {
            throw new DomainVerificationException(
                "DNS CNAME lookup failed: {$e->getMessage()}",
                previous: $e
            );
        }
    }

    public function verifyFileUpload(CustomDomainEloquentModel $domain): array
    {
        $verificationFilePath = "/.well-known/canva-verify-{$domain->verification_token}.txt";
        $verificationUrl = "https://{$domain->domain_name}{$verificationFilePath}";

        try {
            Log::debug('[DomainVerificationService] Attempting file upload verification', [
                'domain' => $domain->domain_name,
                'url' => $verificationUrl,
            ]);

            $response = Http::timeout(self::FILE_UPLOAD_TIMEOUT)
                ->get($verificationUrl);

            if ($response->successful()) {
                $content = trim($response->body());

                if ($content === $domain->verification_token) {
                    return [
                        'success' => true,
                        'method' => 'file_upload',
                        'verification_url' => $verificationUrl,
                        'file_content' => $content,
                    ];
                }

                return [
                    'success' => false,
                    'method' => 'file_upload',
                    'error' => 'File content does not match verification token',
                    'expected_content' => $domain->verification_token,
                    'actual_content' => $content,
                    'verification_url' => $verificationUrl,
                ];
            }

            return [
                'success' => false,
                'method' => 'file_upload',
                'error' => 'Verification file not found or not accessible',
                'http_status' => $response->status(),
                'verification_url' => $verificationUrl,
            ];
        } catch (\Throwable $e) {
            throw new DomainVerificationException(
                "File upload verification failed: {$e->getMessage()}",
                previous: $e
            );
        }
    }

    public function retryVerification(CustomDomainEloquentModel $domain, int $maxAttempts = self::MAX_RETRY_ATTEMPTS): array
    {
        $attempt = 0;
        $lastError = null;

        while ($attempt < $maxAttempts) {
            $attempt++;

            try {
                Log::info('[DomainVerificationService] Retry verification attempt', [
                    'domain_uuid' => $domain->uuid,
                    'attempt' => $attempt,
                    'max_attempts' => $maxAttempts,
                ]);

                $result = $this->verifyDomain($domain);

                if ($result['success']) {
                    return $result;
                }

                $lastError = $result['error'] ?? 'Verification failed';

                sleep(2 * $attempt);
            } catch (\Throwable $e) {
                $lastError = $e->getMessage();

                if ($attempt < $maxAttempts) {
                    sleep(2 * $attempt);
                }
            }
        }

        return [
            'success' => false,
            'method' => $domain->verification_method,
            'error' => "Max retry attempts ({$maxAttempts}) exceeded. Last error: {$lastError}",
            'attempts' => $maxAttempts,
        ];
    }

    protected function getDnsTxtRecords(string $hostname): array
    {
        $records = @dns_get_record($hostname, DNS_TXT);

        if ($records === false) {
            return [];
        }

        return array_map(fn($record) => $record['txt'], $records);
    }

    protected function getDnsCnameRecords(string $hostname): array
    {
        $records = @dns_get_record($hostname, DNS_CNAME);

        if ($records === false) {
            return [];
        }

        return array_map(fn($record) => $record['target'], $records);
    }

    private function logVerificationAttempt(CustomDomainEloquentModel $domain, array $result): void
    {
        try {
            DomainVerificationLogEloquentModel::create([
                'custom_domain_id' => $domain->id,
                'verification_method' => $domain->verification_method,
                'verification_status' => $result['success'] ? 'success' : 'failed',
                'verification_response' => $result,
                'error_message' => $result['error'] ?? null,
                'dns_records_found' => $result['dns_records_found'] ?? [],
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            Log::info('[DomainVerificationService] Verification attempt logged', [
                'domain_uuid' => $domain->uuid,
                'status' => $result['success'] ? 'success' : 'failed',
            ]);
        } catch (\Throwable $e) {
            Log::error('[DomainVerificationService] Failed to log verification attempt', [
                'domain_uuid' => $domain->uuid,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
