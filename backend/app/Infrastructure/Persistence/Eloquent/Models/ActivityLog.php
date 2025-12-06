<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class ActivityLog extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'activity_logs';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'user_id',
        'user_email',
        'user_name',
        'action',
        'resource',
        'resource_id',
        'details',
        'ip_address',
        'user_agent',
        'duration',
        'status',
    ];

    protected $casts = [
        'details' => 'array',
        'duration' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
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