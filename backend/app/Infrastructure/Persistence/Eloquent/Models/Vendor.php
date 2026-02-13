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
        // Vendor Portal fields
        'onboarding_status',
        'onboarding_completed_at',
        'portal_access_enabled',
        'portal_last_access_at',
        'welcome_email_sent_at',
        'temporary_password_expires_at',
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
        'portal_access_enabled' => 'boolean',
        'onboarding_completed_at' => 'datetime',
        'portal_last_access_at' => 'datetime',
        'welcome_email_sent_at' => 'datetime',
        'temporary_password_expires_at' => 'datetime',
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

    /**
     * Get the user accounts associated with this vendor (for portal access).
     * Requirements: 2.4
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class, 'vendor_id', 'uuid');
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

    /**
     * Enable portal access for this vendor.
     * Requirements: 2.5
     */
    public function enablePortalAccess(): void
    {
        $this->update(['portal_access_enabled' => true]);
    }

    /**
     * Disable portal access for this vendor.
     * Requirements: 2.6
     */
    public function disablePortalAccess(): void
    {
        $this->update(['portal_access_enabled' => false]);
    }

    /**
     * Mark onboarding as completed.
     * Requirements: 17.7
     */
    public function completeOnboarding(): void
    {
        $this->update([
            'onboarding_status' => 'completed',
            'onboarding_completed_at' => now(),
        ]);
    }

    /**
     * Record portal access timestamp.
     * Requirements: 2.1
     */
    public function recordPortalAccess(): void
    {
        $this->update(['portal_last_access_at' => now()]);
    }

    /**
     * Check if vendor can access the portal.
     * Requirements: 2.1, 2.5, 2.6
     */
    public function canAccessPortal(): bool
    {
        return $this->portal_access_enabled 
            && $this->status === 'active'
            && $this->onboarding_status === 'completed';
    }

    /**
     * Check if vendor is active.
     */
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    /**
     * Check if onboarding is completed.
     */
    public function isOnboardingCompleted(): bool
    {
        return $this->onboarding_status === 'completed';
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
