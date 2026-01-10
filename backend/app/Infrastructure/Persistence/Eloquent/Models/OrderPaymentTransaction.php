<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class OrderPaymentTransaction extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'order_payment_transactions';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'order_id',
        'customer_id',
        'vendor_id',
        'direction',
        'type',
        'status',
        'amount',
        'currency',
        'method',
        'reference',
        'due_at',
        'paid_at',
        'metadata',
    ];

    protected $casts = [
        'metadata' => 'json',
        'amount' => 'integer',
        'due_at' => 'datetime',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'due_at',
        'paid_at',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
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
