<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class OrderVendorNegotiation extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'order_vendor_negotiations';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'vendor_id',
        'status',
        'initial_offer',
        'latest_offer',
        'currency',
        'terms',
        'history',
        'round',
        'expires_at',
        'closed_at',
    ];

    protected $casts = [
        'terms' => 'array',
        'history' => 'array',
        'initial_offer' => 'integer',
        'latest_offer' => 'integer',
        'round' => 'integer',
        'expires_at' => 'datetime',
        'closed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'expires_at',
        'closed_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }
        });
    }
}
