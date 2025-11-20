<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\TenantEloquentModel;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class EmailVerification extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'email_verifications';

    protected $fillable = [
        'tenant_id',
        'email',
        'token',
        'user_type',
        'expires_at',
        'verified',
        'verified_at',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'expires_at' => 'datetime',
        'verified_at' => 'datetime',
        'verified' => 'boolean',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(TenantEloquentModel::class, 'tenant_id');
    }

    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isVerified(): bool
    {
        return $this->verified;
    }

    public function scopeValid($query)
    {
        return $query->where('expires_at', '>', now())
                    ->where('verified', false);
    }

    public function scopeForEmail($query, string $email)
    {
        return $query->where('email', $email);
    }

    public function scopeForUserType($query, string $userType)
    {
        return $query->where('user_type', $userType);
    }
}
