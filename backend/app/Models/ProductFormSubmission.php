<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductFormSubmission extends Model
{
    use HasFactory;

    protected $table = 'product_form_submissions';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'product_id',
        'product_uuid',
        'form_configuration_id',
        'form_configuration_uuid',
        'order_id',
        'order_uuid',
        'customer_id',
        'customer_uuid',
        'submission_data',
        'user_agent',
        'ip_address',
        'referrer',
        'completion_time',
        'is_completed',
        'is_converted_to_order',
        'started_at',
        'submitted_at',
    ];

    protected $casts = [
        'submission_data' => 'array',
        'completion_time' => 'integer',
        'is_completed' => 'boolean',
        'is_converted_to_order' => 'boolean',
        'started_at' => 'datetime',
        'submitted_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'uuid');
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\Product::class, 'product_id', 'id');
    }

    public function formConfiguration(): BelongsTo
    {
        return $this->belongsTo(ProductFormConfiguration::class, 'form_configuration_id', 'id');
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\Order::class, 'order_id', 'id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\Models\Customer::class, 'customer_id', 'id');
    }

    public function scopeCompleted($query)
    {
        return $query->where('is_completed', true);
    }

    public function scopeConverted($query)
    {
        return $query->where('is_converted_to_order', true);
    }

    public function scopeByTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }
}
