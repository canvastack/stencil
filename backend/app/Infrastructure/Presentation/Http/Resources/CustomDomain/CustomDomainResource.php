<?php

namespace App\Infrastructure\Presentation\Http\Resources\CustomDomain;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CustomDomainResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'uuid' => $this->uuid,
            'tenant_uuid' => $this->tenant?->uuid,
            
            'domainName' => $this->domain_name,
            'isVerified' => $this->is_verified,
            'verifiedAt' => $this->verified_at?->toIso8601String(),
            
            'status' => $this->status,
            
            'verificationMethod' => $this->verification_method,
            'verificationToken' => $this->when(
                !$this->is_verified,
                $this->verification_token
            ),
            
            'ssl' => [
                'enabled' => $this->ssl_enabled,
                'certificatePath' => $this->when(
                    $this->ssl_certificate_path,
                    $this->ssl_certificate_path
                ),
                'issuedAt' => $this->ssl_certificate_issued_at?->toIso8601String(),
                'expiresAt' => $this->ssl_certificate_expires_at?->toIso8601String(),
                'autoRenew' => $this->auto_renew_ssl,
                'daysUntilExpiry' => $this->when(
                    $this->ssl_certificate_expires_at,
                    function () {
                        return now()->diffInDays($this->ssl_certificate_expires_at, false);
                    }
                ),
            ],
            
            'dns' => [
                'provider' => $this->dns_provider,
                'recordId' => $this->dns_record_id,
                'zoneId' => $this->dns_zone_id,
            ],
            
            'configuration' => [
                'redirectToHttps' => $this->redirect_to_https,
                'wwwRedirect' => $this->www_redirect,
            ],
            
            'metadata' => $this->metadata ?? [],
            
            'verificationInstructions' => $this->when(
                !$this->is_verified && $this->verification_method,
                function () {
                    return $this->getVerificationInstructions();
                }
            ),
            
            'createdBy' => $this->when(
                $this->createdBy,
                [
                    'uuid' => $this->createdBy?->uuid,
                    'name' => $this->createdBy?->name,
                ]
            ),
            
            'timestamps' => [
                'createdAt' => $this->created_at?->toIso8601String(),
                'updatedAt' => $this->updated_at?->toIso8601String(),
                'deletedAt' => $this->deleted_at?->toIso8601String(),
            ],
        ];
    }

    protected function getVerificationInstructions(): array
    {
        return match ($this->verification_method) {
            'dns_txt' => [
                'type' => 'TXT',
                'host' => '_canva-verify.' . $this->domain_name,
                'value' => $this->verification_token,
                'ttl' => 300,
                'instructions' => 'Add a TXT record to your DNS settings with the following values. DNS propagation may take up to 48 hours.',
            ],
            'dns_cname' => [
                'type' => 'CNAME',
                'host' => '_canva-verify.' . $this->domain_name,
                'value' => $this->verification_token . '.verify.canvastack.com',
                'ttl' => 300,
                'instructions' => 'Add a CNAME record to your DNS settings with the following values. DNS propagation may take up to 48 hours.',
            ],
            'file_upload' => [
                'type' => 'FILE',
                'filename' => 'canva-verify-' . $this->verification_token . '.txt',
                'content' => $this->verification_token,
                'path' => '/.well-known/canva-verify-' . $this->verification_token . '.txt',
                'instructions' => 'Upload the verification file to your website root directory in the .well-known folder.',
            ],
            default => [],
        };
    }
}
