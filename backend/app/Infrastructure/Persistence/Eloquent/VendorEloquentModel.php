<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class VendorEloquentModel extends Model
{
    use HasUuids;

    protected $table = 'vendors';

    protected $fillable = [
        'tenant_id',
        'name',
        'email',
        'phone',
        'address',
        'status',
        'contact_person',
        'notes',
    ];

    protected $casts = [
        'id' => 'string',
        'tenant_id' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    protected static function booted(): void
    {
        static::addGlobalScope('tenant', function (Builder $builder) {
            if (app()->bound('current_tenant')) {
                $tenant = app('current_tenant');
                if ($tenant) {
                    $builder->where('tenant_id', $tenant->id);
                }
            }
        });
    }
}