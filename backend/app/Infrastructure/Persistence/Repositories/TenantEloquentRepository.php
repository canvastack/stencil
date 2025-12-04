<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Tenant\Entities\Tenant;
use App\Domain\Tenant\Repositories\TenantRepositoryInterface;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Shared\Repositories\BaseEloquentRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TenantEloquentRepository extends BaseEloquentRepository implements TenantRepositoryInterface
{
    public function __construct(TenantEloquentModel $model)
    {
        parent::__construct($model);
    }

    public function findBySlug(string $slug): ?Tenant
    {
        $eloquentModel = $this->model->where('slug', $slug)->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByDomain(string $domain): ?Tenant
    {
        $eloquentModel = $this->model->where('domain', $domain)->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function getAllActive(): Collection
    {
        return $this->model->where('status', 'active')->get()
            ->map(fn($model) => $this->mapToEntity($model));
    }

    public function createTenantWithSchema(array $data): Tenant
    {
        return DB::transaction(function () use ($data) {
            // Create tenant record
            $eloquentModel = $this->model->create($data);
            
            // Create tenant schema
            $schemaName = 'tenant_' . $eloquentModel->uuid;
            DB::statement("CREATE SCHEMA IF NOT EXISTS {$schemaName}");
            
            // Update tenant with schema name
            $eloquentModel->update(['schema_name' => $schemaName]);
            
            return $this->mapToEntity($eloquentModel);
        });
    }

    public function deleteTenantWithSchema(string $uuid): bool
    {
        return DB::transaction(function () use ($uuid) {
            $eloquentModel = $this->model->where('uuid', $uuid)->first();
            
            if (!$eloquentModel) {
                return false;
            }
            
            // Drop tenant schema if exists
            if ($eloquentModel->schema_name) {
                DB::statement("DROP SCHEMA IF EXISTS {$eloquentModel->schema_name} CASCADE");
            }
            
            // Delete tenant record
            return $eloquentModel->delete();
        });
    }

    protected function mapToEntity($eloquentModel): Tenant
    {
        if (!$eloquentModel) {
            return null;
        }

        return new Tenant(
            uuid: $eloquentModel->uuid,
            name: $eloquentModel->name,
            slug: $eloquentModel->slug,
            domain: $eloquentModel->domain,
            schemaName: $eloquentModel->schema_name,
            status: $eloquentModel->status,
            settings: $eloquentModel->settings ? json_decode($eloquentModel->settings, true) : [],
            subscriptionPlan: $eloquentModel->subscription_plan,
            subscriptionStatus: $eloquentModel->subscription_status,
            subscriptionEndsAt: $eloquentModel->subscription_ends_at ? 
                new \DateTime($eloquentModel->subscription_ends_at) : null,
            createdAt: new \DateTime($eloquentModel->created_at),
            updatedAt: new \DateTime($eloquentModel->updated_at)
        );
    }

    protected function mapToEloquent($entity, $eloquentModel = null)
    {
        $eloquentModel = $eloquentModel ?: new TenantEloquentModel();
        
        if ($entity instanceof Tenant) {
            $eloquentModel->fill([
                'uuid' => $entity->getUuid(),
                'name' => $entity->getName(),
                'slug' => $entity->getSlug(),
                'domain' => $entity->getDomain(),
                'schema_name' => $entity->getSchemaName(),
                'status' => $entity->getStatus(),
                'settings' => $entity->getSettings() ? json_encode($entity->getSettings()) : null,
                'subscription_plan' => $entity->getSubscriptionPlan(),
                'subscription_status' => $entity->getSubscriptionStatus(),
                'subscription_ends_at' => $entity->getSubscriptionEndsAt()?->format('Y-m-d H:i:s'),
            ]);
        }
        
        return $eloquentModel;
    }
}