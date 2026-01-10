<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class Vendor extends Model implements TenantAwareModel
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
        'industry',
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
        // Enhanced fields for business cycle compliance
        'quality_tier',
        'average_lead_time_days',
        'certifications',
        'performance_score',
        'latitude',
        'longitude',
        'province',
        'city',
        'country',
        'total_value',
        'completion_rate',
        'company',
        'company_name',
        'website',
        'business_license',
        'bank_account_details',
        'company_size',
    ];

    protected $casts = [
        'location' => 'json',
        'specializations' => 'json',
        'payment_terms' => 'json',
        'contacts' => 'json',
        'metadata' => 'json',
        'certifications' => 'json',
        'bank_account_details' => 'json',
        'minimum_order' => 'integer',
        'total_orders' => 'integer',
        'total_value' => 'integer',
        'lead_time' => 'integer',
        'average_lead_time_days' => 'integer',
        'rating' => 'decimal:2',
        'performance_score' => 'decimal:2',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'completion_rate' => 'decimal:2',
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

        static::saving(function ($model) {
            $classificationService = app(\App\Domain\Vendor\Services\VendorClassificationService::class);
            $model->company_size = $classificationService->calculateCompanySize($model);
        });
    }
}
