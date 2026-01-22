<?php

namespace App\Application\TenantConfiguration\Services;

use App\Domain\TenantConfiguration\Services\SSLProviderInterface;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SSLCertificateService
{
    public function __construct(
        private SSLProviderInterface $sslProvider
    ) {
    }

    public function provisionCertificate(string $domainUuid): array
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->whereNull('deleted_at')
                ->firstOrFail();

            if (!$domain->is_verified) {
                throw new \RuntimeException('Domain must be verified before SSL provisioning');
            }

            Log::info('[SSLCertificateService] Provisioning SSL certificate', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
                'tenant_id' => $domain->tenant_id,
            ]);

            $email = config('ssl.letsencrypt.email');

            $result = $this->sslProvider->provisionCertificate(
                $domain->domain_name,
                $email
            );

            if (!$result['success']) {
                throw new \RuntimeException($result['error'] ?? 'Failed to provision SSL certificate');
            }

            $domain->update([
                'ssl_enabled' => true,
                'ssl_certificate_path' => $result['certificate_path'],
                'ssl_certificate_issued_at' => $result['issued_at'],
                'ssl_certificate_expires_at' => $result['expires_at'],
                'auto_renew_ssl' => true,
                'updated_at' => now(),
            ]);

            Log::info('[SSLCertificateService] SSL certificate provisioned successfully', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
                'expires_at' => $result['expires_at'],
            ]);

            return [
                'success' => true,
                'domain' => [
                    'uuid' => $domain->uuid,
                    'domain_name' => $domain->domain_name,
                    'ssl_enabled' => true,
                    'ssl_certificate_issued_at' => $result['issued_at'],
                    'ssl_certificate_expires_at' => $result['expires_at'],
                ],
                'certificate' => [
                    'certificate_path' => $result['certificate_path'],
                    'private_key_path' => $result['private_key_path'],
                    'fullchain_path' => $result['fullchain_path'],
                ],
            ];
        } catch (\Throwable $e) {
            Log::error('[SSLCertificateService] SSL provisioning failed', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function renewCertificate(string $domainUuid): array
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->whereNull('deleted_at')
                ->firstOrFail();

            if (!$domain->ssl_enabled) {
                throw new \RuntimeException('SSL is not enabled for this domain');
            }

            Log::info('[SSLCertificateService] Renewing SSL certificate', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
                'current_expiry' => $domain->ssl_certificate_expires_at,
            ]);

            $email = config('ssl.letsencrypt.email');

            $result = $this->sslProvider->renewCertificate(
                $domain->domain_name,
                $email
            );

            if (!$result['success']) {
                throw new \RuntimeException($result['error'] ?? 'Failed to renew SSL certificate');
            }

            $domain->update([
                'ssl_certificate_path' => $result['certificate_path'],
                'ssl_certificate_issued_at' => $result['issued_at'],
                'ssl_certificate_expires_at' => $result['expires_at'],
                'updated_at' => now(),
            ]);

            Log::info('[SSLCertificateService] SSL certificate renewed successfully', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
                'new_expiry' => $result['expires_at'],
            ]);

            return [
                'success' => true,
                'domain' => [
                    'uuid' => $domain->uuid,
                    'domain_name' => $domain->domain_name,
                    'ssl_certificate_issued_at' => $result['issued_at'],
                    'ssl_certificate_expires_at' => $result['expires_at'],
                ],
            ];
        } catch (\Throwable $e) {
            Log::error('[SSLCertificateService] SSL renewal failed', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function revokeCertificate(string $domainUuid): array
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->whereNull('deleted_at')
                ->firstOrFail();

            if (!$domain->ssl_enabled) {
                throw new \RuntimeException('SSL is not enabled for this domain');
            }

            Log::info('[SSLCertificateService] Revoking SSL certificate', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
            ]);

            $success = $this->sslProvider->revokeCertificate($domain->domain_name);

            if (!$success) {
                throw new \RuntimeException('Failed to revoke SSL certificate');
            }

            $domain->update([
                'ssl_enabled' => false,
                'ssl_certificate_path' => null,
                'ssl_certificate_issued_at' => null,
                'ssl_certificate_expires_at' => null,
                'auto_renew_ssl' => false,
                'updated_at' => now(),
            ]);

            Log::info('[SSLCertificateService] SSL certificate revoked successfully', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
            ]);

            return [
                'success' => true,
                'message' => 'SSL certificate revoked successfully',
            ];
        } catch (\Throwable $e) {
            Log::error('[SSLCertificateService] SSL revocation failed', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    public function getCertificateInfo(string $domainUuid): ?array
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->whereNull('deleted_at')
                ->firstOrFail();

            if (!$domain->ssl_enabled) {
                return null;
            }

            $info = $this->sslProvider->getCertificateInfo($domain->domain_name);

            if ($info) {
                $info['auto_renew_enabled'] = $domain->auto_renew_ssl;
                $info['renewal_threshold_days'] = config('ssl.renewal.days_before_expiry', 30);
                $info['needs_renewal'] = $info['days_until_expiry'] <= config('ssl.renewal.days_before_expiry', 30);
            }

            return $info;
        } catch (\Throwable $e) {
            Log::error('[SSLCertificateService] Failed to get certificate info', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    public function getExpiringCertificates(int $daysThreshold = 30): array
    {
        $domains = CustomDomainEloquentModel::where('ssl_enabled', true)
            ->where('status', 'active')
            ->where(function ($query) use ($daysThreshold) {
                $query->where('ssl_certificate_expires_at', '<', now()->addDays($daysThreshold))
                    ->orWhereNull('ssl_certificate_expires_at');
            })
            ->whereNull('deleted_at')
            ->get();

        $result = [];

        foreach ($domains as $domain) {
            $daysUntilExpiry = null;
            if ($domain->ssl_certificate_expires_at) {
                $daysUntilExpiry = now()->diffInDays($domain->ssl_certificate_expires_at, false);
            }

            $result[] = [
                'uuid' => $domain->uuid,
                'domain_name' => $domain->domain_name,
                'tenant_id' => $domain->tenant_id,
                'ssl_certificate_expires_at' => $domain->ssl_certificate_expires_at,
                'days_until_expiry' => $daysUntilExpiry,
                'auto_renew_ssl' => $domain->auto_renew_ssl,
                'is_expired' => $daysUntilExpiry !== null && $daysUntilExpiry < 0,
            ];
        }

        return $result;
    }

    public function renewExpiringCertificates(int $daysThreshold = 30): array
    {
        $expiringDomains = $this->getExpiringCertificates($daysThreshold);

        $results = [
            'total' => count($expiringDomains),
            'renewed' => 0,
            'failed' => 0,
            'skipped' => 0,
            'details' => [],
        ];

        foreach ($expiringDomains as $domainInfo) {
            if (!$domainInfo['auto_renew_ssl']) {
                $results['skipped']++;
                $results['details'][] = [
                    'domain' => $domainInfo['domain_name'],
                    'status' => 'skipped',
                    'reason' => 'Auto-renewal disabled',
                ];
                continue;
            }

            $result = $this->renewCertificate($domainInfo['uuid']);

            if ($result['success']) {
                $results['renewed']++;
                $results['details'][] = [
                    'domain' => $domainInfo['domain_name'],
                    'status' => 'renewed',
                    'new_expiry' => $result['domain']['ssl_certificate_expires_at'] ?? null,
                ];
            } else {
                $results['failed']++;
                $results['details'][] = [
                    'domain' => $domainInfo['domain_name'],
                    'status' => 'failed',
                    'error' => $result['error'] ?? 'Unknown error',
                ];
            }
        }

        Log::info('[SSLCertificateService] Bulk renewal completed', [
            'total' => $results['total'],
            'renewed' => $results['renewed'],
            'failed' => $results['failed'],
            'skipped' => $results['skipped'],
        ]);

        return $results;
    }

    public function enableAutoRenewal(string $domainUuid): bool
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->whereNull('deleted_at')
                ->firstOrFail();

            if (!$domain->ssl_enabled) {
                throw new \RuntimeException('SSL must be enabled before auto-renewal can be activated');
            }

            $domain->update([
                'auto_renew_ssl' => true,
                'updated_at' => now(),
            ]);

            Log::info('[SSLCertificateService] Auto-renewal enabled', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('[SSLCertificateService] Failed to enable auto-renewal', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    public function disableAutoRenewal(string $domainUuid): bool
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->whereNull('deleted_at')
                ->firstOrFail();

            $domain->update([
                'auto_renew_ssl' => false,
                'updated_at' => now(),
            ]);

            Log::info('[SSLCertificateService] Auto-renewal disabled', [
                'domain_uuid' => $domainUuid,
                'domain_name' => $domain->domain_name,
            ]);

            return true;
        } catch (\Throwable $e) {
            Log::error('[SSLCertificateService] Failed to disable auto-renewal', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
