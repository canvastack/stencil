<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class NotificationPreference extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'notification_preferences';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'user_id',
        'preferences',
    ];

    protected $casts = [
        'preferences' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
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