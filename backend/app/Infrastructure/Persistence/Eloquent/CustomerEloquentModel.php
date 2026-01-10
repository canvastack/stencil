<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

class CustomerEloquentModel extends Model
{
    use HasFactory;

    protected $table = 'customers';
    
    protected static function newFactory()
    {
        return \Database\Factories\Infrastructure\Persistence\Eloquent\Models\CustomerFactory::new();
    }

    protected $fillable = [
        'uuid',
        'tenant_id',
        'first_name',
        'last_name',
        'name',
        'email',
        'phone',
        'address',
        'city',
        'province',
        'postal_code',
        'status',
        'customer_type',
        'company_name',
        'company',
        'location',
        'tags',
        'metadata',
        'notes',
        'tax_id',
        'business_license',
        'total_orders',
        'total_spent',
        'last_order_at',
        'last_order_date',
        'notification_preferences',
    ];

    protected $casts = [
        'location' => 'json',
        'tags' => 'json',
        'metadata' => 'json',
        'notification_preferences' => 'json',
        'total_orders' => 'integer',
        'total_spent' => 'integer',
        'last_order_date' => 'datetime',
        'last_order_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
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