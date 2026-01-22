<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Tenant\Entities\Tenant;
use App\Domain\Tenant\Repositories\TenantRepositoryInterface;
use App\Domain\Tenant\ValueObjects\TenantSlug;
use App\Domain\Tenant\ValueObjects\TenantName;
use App\Domain\Tenant\Enums\TenantStatus;
use App\Domain\Tenant\Enums\SubscriptionStatus;
use App\Domain\Shared\ValueObjects\Uuid;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TenantEloquentRepository implements TenantRepositoryInterface
{
    public function __construct(
        private TenantEloquentModel $model
    ) {}

    public function save(Tenant $tenant): void
    {
        $data = [
            'uuid' => $tenant->getId()->toString(),
            'slug' => $tenant->getSlug()->getValue(),
            'name' => $tenant->getName()->getValue(),
            'status' => $tenant->getStatus()->value,
            'subscription_status' => $tenant->getSubscriptionStatus()->value,
            'subscription_ends_at' => $tenant->getSubscriptionEndsAt()?->format('Y-m-d H:i:s'),
        ];

        $this->model->updateOrCreate(
            ['uuid' => $data['uuid']],
            $data
        );
    }

    public function findById(Uuid $id): ?Tenant
    {
        $eloquentModel = $this->model->where('uuid', $id->toString())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findBySlug(TenantSlug $slug): ?Tenant
    {
        $eloquentModel = $this->model->where('slug', $slug->getValue())->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function findByDomain(string $domain): ?Tenant
    {
        $eloquentModel = $this->model->where('domain', $domain)->first();
        
        return $eloquentModel ? $this->mapToEntity($eloquentModel) : null;
    }

    public function exists(TenantSlug $slug): bool
    {
        return $this->model->where('slug', $slug->getValue())->exists();
    }

    public function existsByDomain(string $domain): bool
    {
        return $this->model->where('domain', $domain)->exists();
    }

    public function delete(Uuid $id): void
    {
        $this->model->where('uuid', $id->toString())->delete();
    }

    public function findActive(): array
    {
        $eloquentModels = $this->model->where('status', TenantStatus::ACTIVE->value)->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function findExpiring(int $days = 7): array
    {
        $date = Carbon::now()->addDays($days);
        
        $eloquentModels = $this->model
            ->where('subscription_status', SubscriptionStatus::ACTIVE->value)
            ->where('subscription_ends_at', '<=', $date)
            ->where('subscription_ends_at', '>=', Carbon::now())
            ->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    public function countByStatus(string $status): int
    {
        return $this->model->where('status', $status)->count();
    }

    public function findAll(
        ?string $status = null,
        ?string $subscriptionStatus = null,
        int $limit = 50,
        int $offset = 0
    ): array {
        $query = $this->model->query();

        if ($status) {
            $query->where('status', $status);
        }

        if ($subscriptionStatus) {
            $query->where('subscription_status', $subscriptionStatus);
        }

        $eloquentModels = $query->limit($limit)->offset($offset)->get();
        
        return $eloquentModels->map(fn($model) => $this->mapToEntity($model))->toArray();
    }

    private function mapToEntity(TenantEloquentModel $eloquentModel): Tenant
    {
        return new Tenant(
            id: Uuid::fromString($eloquentModel->uuid),
            slug: new TenantSlug($eloquentModel->slug),
            name: new TenantName($eloquentModel->name),
            status: TenantStatus::from($eloquentModel->status),
            subscriptionStatus: SubscriptionStatus::from($eloquentModel->subscription_status),
            subscriptionEndsAt: $eloquentModel->subscription_ends_at ? 
                Carbon::parse($eloquentModel->subscription_ends_at) : null
        );
    }
}