<?php

namespace App\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class DomainVerificationLogEloquentModel extends Model
{
    const UPDATED_AT = null;

    protected $table = 'domain_verification_logs';

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
        });
    }

    protected $fillable = [
        'uuid',
        'custom_domain_id',
        'verification_attempt_at',
        'verification_method',
        'verification_status',
        'verification_response',
        'error_message',
        'dns_records_found',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'id' => 'integer',
        'custom_domain_id' => 'integer',
        'verification_attempt_at' => 'datetime',
        'verification_response' => 'array',
        'dns_records_found' => 'array',
        'created_at' => 'datetime',
    ];

    public function customDomain(): BelongsTo
    {
        return $this->belongsTo(CustomDomainEloquentModel::class, 'custom_domain_id');
    }

    public function scopeSuccessful($query)
    {
        return $query->where('verification_status', 'success');
    }

    public function scopeFailed($query)
    {
        return $query->where('verification_status', 'failed');
    }

    public function scopeByDomain($query, int $customDomainId)
    {
        return $query->where('custom_domain_id', $customDomainId);
    }

    public function scopeRecent($query, int $hours = 24)
    {
        return $query->where('verification_attempt_at', '>=', now()->subHours($hours));
    }
}
