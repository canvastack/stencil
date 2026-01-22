<?php

namespace App\Application\TenantConfiguration\UseCases;

use App\Application\TenantConfiguration\Services\DomainVerificationService;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\CustomDomainStatus;
use App\Domain\Tenant\Exceptions\DomainVerificationException;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use Illuminate\Support\Facades\Log;

class VerifyDomainOwnershipUseCase
{
    public function __construct(
        private DomainVerificationService $verificationService
    ) {}

    public function execute(string $domainUuid): array
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->firstOrFail();

            if ($domain->is_verified) {
                return [
                    'success' => true,
                    'already_verified' => true,
                    'message' => 'Domain is already verified',
                    'domain' => [
                        'uuid' => $domain->uuid,
                        'domain_name' => $domain->domain_name,
                        'is_verified' => true,
                        'verified_at' => $domain->verified_at?->toIso8601String(),
                    ],
                ];
            }

            $verificationResult = $this->verificationService->verifyDomain($domain);

            if ($verificationResult['success']) {
                $this->markDomainAsVerified($domain);

                Log::info('[VerifyDomainOwnershipUseCase] Domain verified successfully', [
                    'domain_uuid' => $domain->uuid,
                    'domain_name' => $domain->domain_name,
                ]);

                return [
                    'success' => true,
                    'already_verified' => false,
                    'message' => 'Domain verified successfully',
                    'verification_method' => $verificationResult['method'],
                    'verification_details' => $verificationResult,
                    'domain' => [
                        'uuid' => $domain->uuid,
                        'domain_name' => $domain->domain_name,
                        'is_verified' => true,
                        'verified_at' => $domain->fresh()->verified_at?->toIso8601String(),
                        'status' => CustomDomainStatus::VERIFIED->value,
                    ],
                ];
            }

            $this->markDomainAsFailed($domain);

            return [
                'success' => false,
                'message' => 'Domain verification failed',
                'error' => $verificationResult['error'] ?? 'Verification failed',
                'verification_method' => $verificationResult['method'],
                'verification_details' => $verificationResult,
                'help' => $this->getVerificationHelp($domain->verification_method, $verificationResult),
            ];
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            throw new DomainVerificationException('Domain not found');
        } catch (DomainVerificationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('[VerifyDomainOwnershipUseCase] Unexpected error during verification', [
                'domain_uuid' => $domainUuid,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw new DomainVerificationException(
                'An unexpected error occurred during domain verification',
                previous: $e
            );
        }
    }

    public function executeWithRetry(string $domainUuid, int $maxAttempts = 3): array
    {
        try {
            $domain = CustomDomainEloquentModel::where('uuid', $domainUuid)
                ->firstOrFail();

            if ($domain->is_verified) {
                return [
                    'success' => true,
                    'already_verified' => true,
                    'message' => 'Domain is already verified',
                ];
            }

            $verificationResult = $this->verificationService->retryVerification($domain, $maxAttempts);

            if ($verificationResult['success']) {
                $this->markDomainAsVerified($domain);

                return [
                    'success' => true,
                    'message' => 'Domain verified successfully after retry',
                    'attempts' => $verificationResult['attempts'] ?? 1,
                    'verification_details' => $verificationResult,
                ];
            }

            $this->markDomainAsFailed($domain);

            return [
                'success' => false,
                'message' => 'Domain verification failed after all retry attempts',
                'error' => $verificationResult['error'] ?? 'Verification failed',
                'attempts' => $maxAttempts,
                'verification_details' => $verificationResult,
            ];
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            throw new DomainVerificationException('Domain not found');
        }
    }

    private function markDomainAsVerified(CustomDomainEloquentModel $domain): void
    {
        $domain->update([
            'is_verified' => true,
            'verified_at' => now(),
            'status' => CustomDomainStatus::VERIFIED->value,
        ]);
    }

    private function markDomainAsFailed(CustomDomainEloquentModel $domain): void
    {
        $domain->update([
            'status' => CustomDomainStatus::FAILED->value,
        ]);
    }

    private function getVerificationHelp(string $method, array $result): string
    {
        return match ($method) {
            'dns_txt' => 'Please ensure the TXT record is correctly configured in your DNS settings. '
                . 'DNS propagation may take up to 48 hours. '
                . 'Expected record: _canva-verify.' . ($result['expected_value'] ?? ''),
            'dns_cname' => 'Please ensure the CNAME record is correctly configured in your DNS settings. '
                . 'DNS propagation may take up to 48 hours. '
                . 'Expected record: _canva-verify pointing to ' . ($result['expected_value'] ?? ''),
            'file_upload' => 'Please ensure the verification file is uploaded to the correct location '
                . 'and is publicly accessible via HTTPS. '
                . 'File should be accessible at: ' . ($result['verification_url'] ?? ''),
            default => 'Please check your verification method configuration and try again.',
        };
    }
}
