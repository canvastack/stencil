<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class ContentRevisionEloquentModel extends Model
{
    protected $table = 'canplug_pagen_revisions';
    
    public $timestamps = false;
    
    protected $fillable = [
        'uuid',
        'content_id',
        'title',
        'excerpt',
        'content',
        'content_format',
        'created_by',
        'change_summary',
        'metadata',
        'created_at',
    ];

    protected $casts = [
        'content' => 'array',
        'metadata' => 'array',
        'created_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
    ];

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    protected static function boot()
    {
        parent::boot();
        
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = (string) Str::uuid();
            }
            
            if (empty($model->created_at)) {
                $model->created_at = now();
            }
        });
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(ContentEloquentModel::class, 'content_id', 'uuid');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'created_by', 'uuid');
    }

    public function scopeForContent($query, string $contentUuid)
    {
        return $query->where('content_id', $contentUuid);
    }
}
