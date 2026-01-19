<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Support\Str;
use App\Infrastructure\Persistence\Eloquent\Models\Tenant;
use App\Infrastructure\Persistence\Eloquent\UserEloquentModel as User;
use App\Infrastructure\Persistence\Eloquent\AccountEloquentModel as Account;

class InstalledPlugin extends Model
{
    use HasFactory;
    protected $fillable = [
        'tenant_id',
        'plugin_name',
        'plugin_version',
        'display_name',
        'status',
        'manifest',
        'migrations_run',
        'settings',
        'requested_at',
        'requested_by',
        'approved_at',
        'approved_by',
        'approval_notes',
        'installed_at',
        'installed_by',
        'expires_at',
        'expiry_notified_at',
        'rejected_at',
        'rejected_by',
        'rejection_reason',
    ];

    protected $casts = [
        'manifest' => 'array',
        'migrations_run' => 'array',
        'settings' => 'array',
        'requested_at' => 'datetime',
        'approved_at' => 'datetime',
        'installed_at' => 'datetime',
        'expires_at' => 'datetime',
        'expiry_notified_at' => 'datetime',
        'rejected_at' => 'datetime',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'uuid');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by', 'uuid');
    }

    public function approver()
    {
        return $this->belongsTo(Account::class, 'approved_by', 'uuid');
    }

    public function rejector()
    {
        return $this->belongsTo(Account::class, 'rejected_by', 'uuid');
    }

    public function installer()
    {
        return $this->belongsTo(Account::class, 'installed_by', 'uuid');
    }

    public function isMigrationRun(string $migration): bool
    {
        return in_array($migration, $this->migrations_run ?? []);
    }

    public function markMigrationRun(string $migration): void
    {
        $migrations = $this->migrations_run ?? [];
        if (!in_array($migration, $migrations)) {
            $migrations[] = $migration;
            $this->update(['migrations_run' => $migrations]);
        }
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired';
    }

    public function isSuspended(): bool
    {
        return $this->status === 'suspended';
    }

    public function isRejected(): bool
    {
        return $this->status === 'rejected';
    }

    public function isExpiringSoon(int $days = 1): bool
    {
        if (!$this->expires_at) {
            return false;
        }
        
        return $this->expires_at->diffInDays(now()) <= $days && !$this->expiry_notified_at;
    }
}
