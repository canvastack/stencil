<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class PasswordResetToken extends Model
{
    use HasFactory;

    protected $table = 'password_reset_tokens';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'email',
        'token',
        'user_type',
        'expires_at',
        'used',
        'used_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'used' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    protected $hidden = [
        'token',
    ];

    /**
     * Get the tenant relationship for tenant-scoped tokens
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id');
    }

    /**
     * Scope to active (unexpired and unused) tokens
     */
    public function scopeActive($query)
    {
        return $query->where('used', false)
            ->where('expires_at', '>', now());
    }

    /**
     * Scope to expired tokens
     */
    public function scopeExpired($query)
    {
        return $query->where('expires_at', '<=', now());
    }

    /**
     * Scope to used tokens
     */
    public function scopeUsed($query)
    {
        return $query->where('used', true);
    }

    /**
     * Scope to platform tokens
     */
    public function scopePlatform($query)
    {
        return $query->where('user_type', 'platform');
    }

    /**
     * Scope to tenant tokens
     */
    public function scopeTenant($query)
    {
        return $query->where('user_type', 'tenant');
    }

    /**
     * Scope to specific tenant
     */
    public function scopeForTenant($query, ?string $tenantId)
    {
        if ($tenantId) {
            return $query->where('tenant_id', $tenantId);
        }
        
        return $query->whereNull('tenant_id');
    }

    /**
     * Check if token is expired
     */
    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    /**
     * Check if token is active (not used and not expired)
     */
    public function isActive(): bool
    {
        return !$this->used && !$this->isExpired();
    }

    /**
     * Mark token as used
     */
    public function markAsUsed(): bool
    {
        return $this->update([
            'used' => true,
            'used_at' => now(),
        ]);
    }

    /**
     * Check if token is valid for the given email
     */
    public function isValidForEmail(string $email): bool
    {
        return $this->email === $email && $this->isActive();
    }

    /**
     * Get time until expiration in minutes
     */
    public function getMinutesUntilExpiration(): int
    {
        if ($this->isExpired()) {
            return 0;
        }

        return (int) now()->diffInMinutes($this->expires_at);
    }

    /**
     * Scope to tokens created in the last N minutes
     */
    public function scopeRecentlyCreated($query, int $minutes = 60)
    {
        return $query->where('created_at', '>=', now()->subMinutes($minutes));
    }

    /**
     * Clean up expired and used tokens older than specified days
     */
    public static function cleanup(int $olderThanDays = 7): int
    {
        $cutoffDate = now()->subDays($olderThanDays);

        return static::where(function ($query) use ($cutoffDate) {
            $query->where('used', true)
                ->orWhere('expires_at', '<=', $cutoffDate);
        })->where('created_at', '<=', $cutoffDate)
        ->delete();
    }
}