<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Tenant\Entities\DomainMapping;
use App\Domain\Tenant\Repositories\DomainMappingRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Tenant\ValueObjects\DomainName;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\Enums\DomainStatus;
use App\Infrastructure\Persistence\Eloquent\DomainMappingEloquentModel;
use DateTime;

class DomainMappingEloquentRepository implements DomainMappingRepositoryInterface
{
    public function __construct(
        private DomainMappingEloquentModel $model
    ) {}

    public function findById(UuidValueObject $id): ?DomainMapping
    {
        $model = $this->model->find($id->getValue());
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByDomain(DomainName $domain): ?DomainMapping
    {
        $model = $this->model
            ->where('domain', $domain->getValue())
            ->first();
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByTenantId(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findPrimaryByTenantId(UuidValueObject $tenantId): ?DomainMapping
    {
        $model = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('is_primary', true)
            ->first();
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findActiveByTenantId(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', DomainStatus::ACTIVE->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByStatus(DomainStatus $status): array
    {
        $models = $this->model
            ->where('status', $status->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findByDomainAndSubdomain(DomainName $domain, ?string $subdomain = null): ?DomainMapping
    {
        $query = $this->model->where('domain', $domain->getValue());
        
        if ($subdomain) {
            $query->where('subdomain', $subdomain);
        } else {
            $query->whereNull('subdomain');
        }
        
        $model = $query->first();
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function save(DomainMapping $domainMapping): DomainMapping
    {
        $data = $this->fromDomain($domainMapping);
        
        $model = $this->model->updateOrCreate(
            ['id' => $data['id']],
            $data
        );
        
        return $this->toDomain($model);
    }

    public function delete(UuidValueObject $id): bool
    {
        return $this->model->where('id', $id->getValue())->delete() > 0;
    }

    public function exists(DomainName $domain, ?string $subdomain = null): bool
    {
        $query = $this->model->where('domain', $domain->getValue());
        
        if ($subdomain) {
            $query->where('subdomain', $subdomain);
        } else {
            $query->whereNull('subdomain');
        }
        
        return $query->exists();
    }

    public function existsForTenant(UuidValueObject $tenantId, DomainName $domain): bool
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('domain', $domain->getValue())
            ->exists();
    }

    public function setPrimary(UuidValueObject $domainMappingId, UuidValueObject $tenantId): bool
    {
        $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->update(['is_primary' => false]);
        
        return $this->model
            ->where('id', $domainMappingId->getValue())
            ->update(['is_primary' => true]) > 0;
    }

    public function unsetAllPrimary(UuidValueObject $tenantId): bool
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->update(['is_primary' => false]) >= 0;
    }

    public function countByTenantId(UuidValueObject $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->count();
    }

    public function findPendingVerification(): array
    {
        $models = $this->model
            ->where('status', DomainStatus::PENDING->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function markAsVerified(UuidValueObject $id): bool
    {
        return $this->model
            ->where('id', $id->getValue())
            ->update([
                'status' => DomainStatus::ACTIVE->value,
                'verified_at' => now(),
            ]) > 0;
    }

    public function markAsFailed(UuidValueObject $id, ?string $reason = null): bool
    {
        return $this->model
            ->where('id', $id->getValue())
            ->update(['status' => DomainStatus::FAILED->value]) > 0;
    }

    public function findExpiringSsl(int $daysBeforeExpiry = 30): array
    {
        return [];
    }

    public function updateStatus(UuidValueObject $id, DomainStatus $status): bool
    {
        return $this->model
            ->where('id', $id->getValue())
            ->update(['status' => $status->value]) > 0;
    }

    public function findByTenantAndStatus(UuidValueObject $tenantId, DomainStatus $status): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function hasPrimaryDomain(UuidValueObject $tenantId): bool
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('is_primary', true)
            ->exists();
    }

    private function toDomain(DomainMappingEloquentModel $model): DomainMapping
    {
        return new DomainMapping(
            new UuidValueObject($model->id),
            new UuidValueObject($model->tenant_id),
            new DomainName($model->domain),
            $model->subdomain ? new SubdomainName($model->subdomain) : null,
            $model->is_primary,
            $model->ssl_enabled,
            $model->ssl_certificate_path,
            DomainStatus::fromString($model->status),
            $model->dns_records,
            $model->verified_at,
            $model->created_at,
            $model->updated_at
        );
    }

    private function fromDomain(DomainMapping $domainMapping): array
    {
        return [
            'id' => $domainMapping->getId()->getValue(),
            'tenant_id' => $domainMapping->getTenantId()->getValue(),
            'domain' => $domainMapping->getDomain()->getValue(),
            'subdomain' => $domainMapping->getSubdomain()?->getValue(),
            'is_primary' => $domainMapping->isPrimary(),
            'ssl_enabled' => $domainMapping->isSslEnabled(),
            'ssl_certificate_path' => $domainMapping->getSslCertificatePath(),
            'status' => $domainMapping->getStatus()->value,
            'dns_records' => $domainMapping->getDnsRecords(),
            'verified_at' => $domainMapping->getVerifiedAt(),
        ];
    }
}