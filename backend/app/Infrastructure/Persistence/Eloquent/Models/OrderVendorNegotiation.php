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
        'product_id',
        'quantity',
        'specifications',
        'notes',
        'status',
        'initial_offer',
        'latest_offer',
        'currency',
        'quote_details',
        'history',
        'status_history',
        'round',
        'sent_at',
        'responded_at',
        'response_type',
        'response_notes',
        'expires_at',
        'closed_at',
    ];

    protected $casts = [
        'product_id' => 'integer',
        'quantity' => 'integer',
        'specifications' => 'array',
        'quote_details' => 'json',
        'history' => 'array',
        'status_history' => 'array',
        'initial_offer' => 'integer',
        'latest_offer' => 'integer',
        'round' => 'integer',
        'sent_at' => 'datetime',
        'responded_at' => 'datetime',
        'expires_at' => 'datetime',
        'closed_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'sent_at',
        'responded_at',
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
