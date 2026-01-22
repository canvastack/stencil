<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Tenant\Entities\CustomDomain;
use App\Domain\Tenant\Repositories\CustomDomainRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\CustomDomainStatus;
use App\Domain\Tenant\Enums\VerificationMethod;
use App\Domain\Tenant\Enums\DnsProvider;
use App\Domain\Tenant\ValueObjects\DomainName;
use App\Domain\Tenant\ValueObjects\DomainVerificationToken;
use App\Infrastructure\Persistence\Eloquent\CustomDomainEloquentModel;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class CustomDomainEloquentRepository implements CustomDomainRepositoryInterface
{
    public function __construct(
        private CustomDomainEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?CustomDomain
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByDomain(DomainName $domain): ?CustomDomain
    {
        $eloquentModel = $this->model
            ->where('domain_name', $domain->getValue())
            ->first();

        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenantId(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function findVerifiedByTenantId(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->where('is_verified', true)
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function findActiveByTenantId(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->where('status', CustomDomainStatus::ACTIVE->value)
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function findByStatus(CustomDomainStatus $status): array
    {
        $eloquentModels = $this->model
            ->where('status', $status->value)
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function findPendingVerification(): array
    {
        $eloquentModels = $this->model
            ->where('status', CustomDomainStatus::PENDING_VERIFICATION->value)
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function findExpiringSsl(int $daysBeforeExpiry = 30): array
    {
        $expiryDate = Carbon::now()->addDays($daysBeforeExpiry);

        $eloquentModels = $this->model
            ->where('ssl_enabled', true)
            ->whereNotNull('ssl_certificate_expires_at')
            ->where('ssl_certificate_expires_at', '<=', $expiryDate)
            ->where('ssl_certificate_expires_at', '>=', Carbon::now())
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function save(CustomDomain $domain): CustomDomain
    {
        return DB::transaction(function () use ($domain) {
            $eloquentModel = $this->model->where('uuid', $domain->getId()->getValue())->first();

            if ($eloquentModel) {
                $eloquentModel->update($this->mapToEloquentArray($domain));
            } else {
                $eloquentModel = $this->model->create($this->mapToEloquentArray($domain));
            }

            return $this->mapToEntity($eloquentModel);
        });
    }

    public function delete(Uuid $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->delete();
    }

    public function exists(DomainName $domain): bool
    {
        return $this->model->where('domain_name', $domain->getValue())->exists();
    }

    public function existsForTenant(Uuid $tenantId, DomainName $domain): bool
    {
        return $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->where('domain_name', $domain->getValue())
            ->exists();
    }

    public function markAsVerified(Uuid $id): bool
    {
        return $this->model
            ->where('uuid', $id->getValue())
            ->update([
                'is_verified' => true,
                'verified_at' => Carbon::now(),
                'status' => CustomDomainStatus::VERIFIED->value
            ]);
    }

    public function markAsFailed(Uuid $id): bool
    {
        return $this->model
            ->where('uuid', $id->getValue())
            ->update([
                'status' => CustomDomainStatus::FAILED->value
            ]);
    }

    public function activate(Uuid $id): bool
    {
        return $this->model
            ->where('uuid', $id->getValue())
            ->update([
                'status' => CustomDomainStatus::ACTIVE->value
            ]);
    }

    public function suspend(Uuid $id): bool
    {
        return $this->model
            ->where('uuid', $id->getValue())
            ->update([
                'status' => CustomDomainStatus::SUSPENDED->value
            ]);
    }

    public function updateStatus(Uuid $id, CustomDomainStatus $status): bool
    {
        return $this->model
            ->where('uuid', $id->getValue())
            ->update(['status' => $status->value]);
    }

    public function countByTenantId(Uuid $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->count();
    }

    public function countByStatus(CustomDomainStatus $status): int
    {
        return $this->model
            ->where('status', $status->value)
            ->count();
    }

    public function findAll(
        ?Uuid $tenantId = null,
        ?CustomDomainStatus $status = null,
        ?bool $isVerified = null,
        int $limit = 50,
        int $offset = 0
    ): array {
        $query = $this->model->query();

        if ($tenantId) {
            $query->where('tenant_id', $this->getTenantInternalId($tenantId));
        }

        if ($status) {
            $query->where('status', $status->value);
        }

        if ($isVerified !== null) {
            $query->where('is_verified', $isVerified);
        }

        $eloquentModels = $query->limit($limit)->offset($offset)->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    private function mapToEntity(CustomDomainEloquentModel $model): CustomDomain
    {
        return new CustomDomain(
            id: Uuid::fromString($model->uuid),
            tenantId: $this->getTenantUuidById($model->tenant_id),
            domainName: new DomainName($model->domain_name),
            isVerified: $model->is_verified,
            verificationMethod: $model->verification_method ? VerificationMethod::fromString($model->verification_method) : null,
            verificationToken: $model->verification_token ? DomainVerificationToken::fromString($model->verification_token) : null,
            verifiedAt: $model->verified_at,
            sslEnabled: $model->ssl_enabled,
            sslCertificatePath: $model->ssl_certificate_path,
            sslCertificateIssuedAt: $model->ssl_certificate_issued_at,
            sslCertificateExpiresAt: $model->ssl_certificate_expires_at,
            autoRenewSsl: $model->auto_renew_ssl,
            dnsProvider: $model->dns_provider ? DnsProvider::fromString($model->dns_provider) : null,
            dnsRecordId: $model->dns_record_id,
            dnsZoneId: $model->dns_zone_id,
            status: CustomDomainStatus::fromString($model->status),
            redirectToHttps: $model->redirect_to_https,
            wwwRedirect: $model->www_redirect ?? 'add_www',
            metadata: $model->metadata ?? [],
            createdBy: $model->created_by ? $this->getUserUuidById($model->created_by) : null,
            createdAt: $model->created_at,
            updatedAt: $model->updated_at,
            deletedAt: $model->deleted_at
        );
    }

    private function mapToEloquentArray(CustomDomain $entity): array
    {
        return [
            'uuid' => $entity->getId()->getValue(),
            'tenant_id' => $this->getTenantInternalId($entity->getTenantId()),
            'domain_name' => $entity->getDomainName()->getValue(),
            'is_verified' => $entity->isVerified(),
            'verification_method' => $entity->getVerificationMethod()?->value,
            'verification_token' => $entity->getVerificationToken()?->getValue(),
            'verified_at' => $entity->getVerifiedAt(),
            'ssl_enabled' => $entity->isSslEnabled(),
            'ssl_certificate_path' => $entity->getSslCertificatePath(),
            'ssl_certificate_issued_at' => $entity->getSslCertificateIssuedAt(),
            'ssl_certificate_expires_at' => $entity->getSslCertificateExpiresAt(),
            'auto_renew_ssl' => $entity->shouldAutoRenewSsl(),
            'dns_provider' => $entity->getDnsProvider()?->value,
            'dns_record_id' => $entity->getDnsRecordId(),
            'dns_zone_id' => $entity->getDnsZoneId(),
            'status' => $entity->getStatus()->value,
            'redirect_to_https' => $entity->shouldRedirectToHttps(),
            'www_redirect' => $entity->getWwwRedirect(),
            'metadata' => $entity->getMetadata(),
            'created_by' => $entity->getCreatedBy() ? $this->getUserInternalId($entity->getCreatedBy()) : null,
        ];
    }

    private function getTenantInternalId(Uuid $uuid): int
    {
        return DB::table('tenants')->where('uuid', $uuid->getValue())->value('id');
    }

    private function getTenantUuidById(int $id): Uuid
    {
        $uuid = DB::table('tenants')->where('id', $id)->value('uuid');
        return Uuid::fromString($uuid);
    }

    private function getUserInternalId(Uuid $uuid): int
    {
        return DB::table('users')->where('uuid', $uuid->getValue())->value('id');
    }

    private function getUserUuidById(int $id): Uuid
    {
        $uuid = DB::table('users')->where('id', $id)->value('uuid');
        return Uuid::fromString($uuid);
    }
}
