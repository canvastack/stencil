<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Notifications\Notifiable;

class AccountEloquentModel extends Authenticatable
{
    use HasApiTokens, HasUuids, Notifiable;

    protected $table = 'accounts';

    protected $fillable = [
        'name',
        'email',
        'password',
        'account_type',
        'status',
        'settings',
        'avatar',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'settings' => 'array',
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'password' => 'hashed',
    ];

    // Relationships
    public function createdTenants(): HasMany
    {
        return $this->hasMany(TenantEloquentModel::class, 'created_by');
    }

    public function roles(): BelongsToMany
    {
        return $this->belongsToMany(
            RoleEloquentModel::class,
            'account_roles',
            'account_id',
            'role_id'
        )->withPivot('id')->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopePlatformOwners($query)
    {
        return $query->where('account_type', 'platform_owner');
    }

    // Business Logic Methods
    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function isPlatformOwner(): bool
    {
        return $this->account_type === 'platform_owner';
    }

    public function canManageTenants(): bool
    {
        return $this->isPlatformOwner() && $this->isActive();
    }

    public function updateLastLogin(): void
    {
        $this->update(['last_login_at' => now()]);
    }

    // Override getAuthIdentifierName for Sanctum
    public function getAuthIdentifierName()
    {
        return 'id';
    }

    // Override for proper token scoping
    public function createToken(string $name, array $abilities = ['*'])
    {
        $token = $this->tokens()->create([
            'name' => $name,
            'token' => hash('sha256', $plainTextToken = \Illuminate\Support\Str::random(80)),
            'abilities' => $abilities,
            'tokenable_type' => static::class,
            'tokenable_id' => $this->getKey(),
        ]);

        return new \Laravel\Sanctum\NewAccessToken($token, $token->getKey().'|'.$plainTextToken);
    }
}