<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Tenant\Entities\TenantUrlConfiguration;
use App\Domain\Tenant\Repositories\TenantUrlConfigRepositoryInterface;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Domain\Tenant\Enums\UrlPattern;
use App\Domain\Tenant\ValueObjects\SubdomainName;
use App\Domain\Tenant\ValueObjects\UrlPath;
use App\Infrastructure\Persistence\Eloquent\TenantUrlConfigurationEloquentModel;
use Illuminate\Support\Facades\DB;

class TenantUrlConfigEloquentRepository implements TenantUrlConfigRepositoryInterface
{
    public function __construct(
        private TenantUrlConfigurationEloquentModel $model
    ) {}

    public function findById(Uuid $id): ?TenantUrlConfiguration
    {
        $eloquentModel = $this->model->where('uuid', $id->getValue())->first();
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByTenantId(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function findPrimaryByTenantId(Uuid $tenantId): ?TenantUrlConfiguration
    {
        $eloquentModel = $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->where('is_primary', true)
            ->first();

        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findEnabledByTenantId(Uuid $tenantId): array
    {
        $eloquentModels = $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->where('is_enabled', true)
            ->whereNull('deleted_at')
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function findBySubdomain(SubdomainName $subdomain): ?TenantUrlConfiguration
    {
        $eloquentModel = $this->model
            ->where('subdomain', $subdomain->getValue())
            ->first();

        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByUrlPath(UrlPath $urlPath): ?TenantUrlConfiguration
    {
        $eloquentModel = $this->model
            ->where('url_path', $urlPath->getValue())
            ->first();

        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByCustomDomainId(Uuid $customDomainId): ?TenantUrlConfiguration
    {
        $eloquentModel = $this->model
            ->whereNotNull('custom_domain_id')
            ->whereHas('customDomain', function($query) use ($customDomainId) {
                $query->where('uuid', $customDomainId->getValue());
            })
            ->first();

        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByPattern(UrlPattern $pattern): array
    {
        $eloquentModels = $this->model
            ->where('url_pattern', $pattern->value)
            ->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    public function save(TenantUrlConfiguration $config): TenantUrlConfiguration
    {
        return DB::transaction(function () use ($config) {
            $eloquentModel = $this->model->where('uuid', $config->getId()->getValue())->first();

            if ($eloquentModel) {
                $eloquentModel->update($this->mapToEloquentArray($config));
            } else {
                $eloquentModel = $this->model->create($this->mapToEloquentArray($config));
            }

            return $this->mapToEntity($eloquentModel);
        });
    }

    public function delete(Uuid $id): bool
    {
        return $this->model->where('uuid', $id->getValue())->delete();
    }

    public function exists(Uuid $tenantId, UrlPattern $pattern): bool
    {
        return $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->where('url_pattern', $pattern->value)
            ->exists();
    }

    public function existsSubdomain(SubdomainName $subdomain): bool
    {
        return $this->model->where('subdomain', $subdomain->getValue())->exists();
    }

    public function existsUrlPath(UrlPath $urlPath): bool
    {
        return $this->model->where('url_path', $urlPath->getValue())->exists();
    }

    public function setPrimary(Uuid $configId, Uuid $tenantId): bool
    {
        return DB::transaction(function () use ($configId, $tenantId) {
            $this->unsetAllPrimary($tenantId);

            return $this->model
                ->where('uuid', $configId->getValue())
                ->update(['is_primary' => true]);
        });
    }

    public function unsetAllPrimary(Uuid $tenantId): bool
    {
        return $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->update(['is_primary' => false]);
    }

    public function countByTenantId(Uuid $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->count();
    }

    public function hasPrimaryConfig(Uuid $tenantId): bool
    {
        return $this->model
            ->where('tenant_id', $this->getTenantInternalId($tenantId))
            ->where('is_primary', true)
            ->exists();
    }

    public function enable(Uuid $id): bool
    {
        return $this->model
            ->where('uuid', $id->getValue())
            ->update(['is_enabled' => true]);
    }

    public function disable(Uuid $id): bool
    {
        return $this->model
            ->where('uuid', $id->getValue())
            ->update(['is_enabled' => false]);
    }

    public function findAll(
        ?Uuid $tenantId = null,
        ?UrlPattern $pattern = null,
        ?bool $isEnabled = null,
        int $limit = 50,
        int $offset = 0
    ): array {
        $query = $this->model->query();

        if ($tenantId) {
            $query->where('tenant_id', $this->getTenantInternalId($tenantId));
        }

        if ($pattern) {
            $query->where('url_pattern', $pattern->value);
        }

        if ($isEnabled !== null) {
            $query->where('is_enabled', $isEnabled);
        }

        $eloquentModels = $query->limit($limit)->offset($offset)->get();

        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->all();
    }

    private function mapToEntity(TenantUrlConfigurationEloquentModel $model): TenantUrlConfiguration
    {
        return new TenantUrlConfiguration(
            id: Uuid::fromString($model->uuid),
            tenantId: $this->getTenantUuidById($model->tenant_id),
            urlPattern: UrlPattern::fromString($model->url_pattern),
            isPrimary: $model->is_primary,
            isEnabled: $model->is_enabled,
            subdomain: $model->subdomain ? new SubdomainName($model->subdomain) : null,
            urlPath: $model->url_path ? new UrlPath($model->url_path) : null,
            customDomainId: $model->custom_domain_id ? $this->getCustomDomainUuidById($model->custom_domain_id) : null,
            forceHttps: $model->force_https,
            redirectToPrimary: $model->redirect_to_primary,
            metaTitle: $model->meta_title,
            metaDescription: $model->meta_description,
            ogImageUrl: $model->og_image_url,
            createdAt: $model->created_at,
            updatedAt: $model->updated_at,
            deletedAt: $model->deleted_at
        );
    }

    private function mapToEloquentArray(TenantUrlConfiguration $entity): array
    {
        return [
            'uuid' => $entity->getId()->getValue(),
            'tenant_id' => $this->getTenantInternalId($entity->getTenantId()),
            'url_pattern' => $entity->getUrlPattern()->value,
            'is_primary' => $entity->isPrimary(),
            'is_enabled' => $entity->isEnabled(),
            'subdomain' => $entity->getSubdomain()?->getValue(),
            'url_path' => $entity->getUrlPath()?->getValue(),
            'custom_domain_id' => $entity->getCustomDomainId() ? $this->getCustomDomainInternalId($entity->getCustomDomainId()) : null,
            'force_https' => $entity->forceHttps(),
            'redirect_to_primary' => $entity->shouldRedirectToPrimary(),
            'meta_title' => $entity->getMetaTitle(),
            'meta_description' => $entity->getMetaDescription(),
            'og_image_url' => $entity->getOgImageUrl(),
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

    private function getCustomDomainInternalId(Uuid $uuid): int
    {
        return DB::table('custom_domains')->where('uuid', $uuid->getValue())->value('id');
    }

    private function getCustomDomainUuidById(int $id): Uuid
    {
        $uuid = DB::table('custom_domains')->where('id', $id)->value('uuid');
        return Uuid::fromString($uuid);
    }
}
