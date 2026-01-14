<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ContentCommentEloquentModel extends Model
{
    use SoftDeletes;

    protected $table = 'canplug_pagen_comments';
    
    protected $fillable = [
        'uuid',
        'content_id',
        'parent_id',
        'user_id',
        'author_name',
        'author_email',
        'author_url',
        'comment_text',
        'status',
        'ip_address',
        'user_agent',
        'approved_by',
        'approved_at',
        'spam_score',
        'metadata',
    ];

    protected $casts = [
        'spam_score' => 'integer',
        'metadata' => 'array',
        'approved_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $hidden = [
        'id',
        'ip_address',
        'user_agent',
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
        });
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(ContentEloquentModel::class, 'content_id', 'uuid');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'user_id', 'uuid');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(ContentCommentEloquentModel::class, 'parent_id', 'uuid');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(ContentCommentEloquentModel::class, 'parent_id', 'uuid');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'approved_by', 'uuid');
    }

    public function scopeApproved($query)
    {
        return $query->where('status', 'approved');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeSpam($query)
    {
        return $query->where('status', 'spam');
    }

    public function scopeForContent($query, string $contentUuid)
    {
        return $query->where('content_id', $contentUuid);
    }

    public function scopeRootComments($query)
    {
        return $query->whereNull('parent_id');
    }
}
