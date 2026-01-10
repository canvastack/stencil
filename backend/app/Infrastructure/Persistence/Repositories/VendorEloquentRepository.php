<?php

namespace App\Infrastructure\Persistence\Repositories;

use App\Domain\Vendor\Entities\Vendor;
use App\Domain\Vendor\Repositories\VendorRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use App\Domain\Vendor\ValueObjects\VendorName;
use App\Domain\Vendor\ValueObjects\VendorEmail;
use App\Domain\Vendor\Enums\VendorStatus;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor as VendorModel;

class VendorEloquentRepository implements VendorRepositoryInterface
{
    public function __construct(
        private VendorModel $model
    ) {}

    public function findById(UuidValueObject $id): ?Vendor
    {
        $model = $this->model->with('tenant')->where('uuid', $id->getValue())->first();
        
        if (!$model) {
            return null;
        }
        
        return $this->toDomain($model);
    }

    public function findByEmail(UuidValueObject $tenantId, VendorEmail $email): ?Vendor
    {
        $model = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('email', $email->getValue())
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

    public function findByStatus(UuidValueObject $tenantId, VendorStatus $status): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function findActiveVendors(UuidValueObject $tenantId): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', VendorStatus::ACTIVE->value)
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    public function save(Vendor $vendor): Vendor
    {
        $data = $this->fromDomain($vendor);
        
        $model = $this->model->updateOrCreate(
            ['uuid' => $data['uuid']],
            $data
        );
        
        return $this->toDomain($model);
    }

    public function delete(UuidValueObject $id): bool
    {
        return $this->model->where('id', $id->getValue())->delete() > 0;
    }

    public function existsByEmail(UuidValueObject $tenantId, VendorEmail $email): bool
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('email', $email->getValue())
            ->exists();
    }

    public function countByTenantId(UuidValueObject $tenantId): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->count();
    }

    public function countByStatus(UuidValueObject $tenantId, VendorStatus $status): int
    {
        return $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('status', $status->value)
            ->count();
    }

    public function searchByName(UuidValueObject $tenantId, string $searchTerm): array
    {
        $models = $this->model
            ->where('tenant_id', $tenantId->getValue())
            ->where('name', 'like', "%{$searchTerm}%")
            ->get();
        
        return $models->map(fn($model) => $this->toDomain($model))->toArray();
    }

    private function getTenantUuid(int $tenantId): string
    {
        $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::find($tenantId);
        if (!$tenant) {
            throw new \InvalidArgumentException("Tenant not found with ID: {$tenantId}");
        }
        return $tenant->uuid;
    }

    private function resolveTenantId(UuidValueObject $tenantUuid): int
    {
        $tenant = \App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::where('uuid', $tenantUuid->getValue())->first();
        if (!$tenant) {
            throw new \InvalidArgumentException("Tenant not found with UUID: {$tenantUuid->getValue()}");
        }
        return $tenant->id;
    }

    private function toDomain(VendorModel $model): Vendor
    {
        return new Vendor(
            new UuidValueObject($model->uuid),
            new UuidValueObject($this->getTenantUuid($model->tenant_id)),
            new VendorName($model->name),
            new VendorEmail($model->email),
            $model->phone,
            $model->address,
            VendorStatus::fromString($model->status),
            $model->contact_person,
            $model->notes,
            $model->created_at,
            $model->updated_at
        );
    }

    private function fromDomain(Vendor $vendor): array
    {
        return [
            'uuid' => $vendor->getId()->getValue(),
            'tenant_id' => $this->resolveTenantId($vendor->getTenantId()),
            'name' => $vendor->getName()->getValue(),
            'email' => $vendor->getEmail()->getValue(),
            'phone' => null,
            'address' => null,
            'status' => $vendor->getStatus()->value,
            'contact_person' => null,
            'notes' => null,
        ];
    }
}