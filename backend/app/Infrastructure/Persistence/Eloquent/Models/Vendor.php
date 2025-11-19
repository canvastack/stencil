<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class Vendor extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'vendors';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'code',
        'email',
        'phone',
        'contact_person',
        'category',
        'status',
        'location',
        'address',
        'payment_terms',
        'tax_id',
        'bank_account',
        'bank_name',
        'specializations',
        'lead_time',
        'minimum_order',
        'rating',
        'total_orders',
        'notes',
    ];

    protected $casts = [
        'location' => 'array',
        'specializations' => 'array',
        'payment_terms' => 'array',
        'minimum_order' => 'integer',
        'total_orders' => 'integer',
        'rating' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function negotiations(): HasMany
    {
        return $this->hasMany(OrderVendorNegotiation::class);
    }

    public function paymentTransactions(): HasMany
    {
        return $this->hasMany(OrderPaymentTransaction::class);
    }

    public function disbursements(): HasMany
    {
        return $this->paymentTransactions()->where('direction', 'outgoing');
    }

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
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
