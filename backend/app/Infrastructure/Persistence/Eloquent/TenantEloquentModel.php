<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Spatie\Multitenancy\Models\Tenant as SpatieTenant;

class TenantEloquentModel extends SpatieTenant
{
    use HasUuids;

    protected $table = 'tenants';

    protected $fillable = [
        'name',
        'slug',
        'domain', 
        'database',
        'data',
        'status',
        'subscription_status',
        'trial_ends_at',
        'subscription_ends_at',
        'created_by'
    ];

    protected $casts = [
        'data' => 'array',
        'trial_ends_at' => 'datetime',
        'subscription_ends_at' => 'datetime'
    ];

    // Relationships
    public function users(): HasMany
    {
        return $this->hasMany(UserEloquentModel::class, 'tenant_id');
    }

    public function subscription(): HasOne
    {
        return $this->hasOne(TenantSubscriptionEloquentModel::class, 'tenant_id')
                   ->where('status', 'active');
    }

    public function domainMappings(): HasMany
    {
        return $this->hasMany(DomainMappingEloquentModel::class, 'tenant_id');
    }

    public function creator()
    {
        return $this->belongsTo(AccountEloquentModel::class, 'created_by');
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeOnTrial($query)
    {
        return $query->where('subscription_status', 'active')
                    ->whereNotNull('trial_ends_at')
                    ->where('trial_ends_at', '>', now());
    }

    public function scopeExpiring($query, int $days = 7)
    {
        return $query->where('subscription_status', 'active')
                    ->whereNotNull('subscription_ends_at')
                    ->whereBetween('subscription_ends_at', [now(), now()->addDays($days)]);
    }

    // Business Logic Methods (delegated to Domain Entity)
    public function isActive(): bool
    {
        return $this->status === 'active' && 
               $this->subscription_status === 'active' &&
               ($this->subscription_ends_at === null || $this->subscription_ends_at->isFuture());
    }

    public function isOnTrial(): bool
    {
        return $this->subscription_status === 'active' && 
               $this->trial_ends_at && 
               $this->trial_ends_at->isFuture();
    }

    public function hasCustomDomain(): bool
    {
        return !empty($this->domain) || $this->domainMappings()->where('status', 'active')->exists();
    }

    public function getPrimaryDomain(): string
    {
        if ($this->domain) {
            return $this->domain;
        }
        
        $mapping = $this->domainMappings()->where('is_primary', true)->where('status', 'active')->first();
        return $mapping ? $mapping->domain : "canvastencil.com/{$this->slug}";
    }

    public function getPublicUrl(string $path = ''): string
    {
        $domain = $this->getPrimaryDomain();
        $path = ltrim($path, '/');
        
        if ($this->hasCustomDomain()) {
            return "https://{$domain}/{$path}";
        }
        
        return "https://canvastencil.com/{$this->slug}/{$path}";
    }

    public function getAdminUrl(string $path = ''): string
    {
        $path = ltrim($path, '/');
        return $this->getPublicUrl("admin/{$path}");
    }

    // Subscription Management
    public function canCreateUsers(): bool
    {
        $subscription = $this->subscription;
        if (!$subscription) return false;
        
        return $this->users()->count() < $subscription->user_limit;
    }

    public function canCreateProducts(): bool
    {
        $subscription = $this->subscription;
        if (!$subscription) return false;
        
        // This would need to be implemented based on the products relationship
        // return $this->products()->count() < $subscription->product_limit;
        return true; // Placeholder
    }

    public function getRemainingStorageMB(): int
    {
        $subscription = $this->subscription;
        if (!$subscription) return 0;
        
        $usedMB = $this->calculateUsedStorageMB();
        return max(0, $subscription->storage_limit_mb - $usedMB);
    }

    private function calculateUsedStorageMB(): int
    {
        // TODO: Implement storage calculation based on file uploads, etc.
        return 0;
    }
}