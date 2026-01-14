<?php

declare(strict_types=1);

namespace Plugins\PagesEngine\Infrastructure\Persistence\Eloquent;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class ContentEloquentModel extends Model
{
    use SoftDeletes;

    protected $table = 'canplug_pagen_contents';
    
    protected $fillable = [
        'uuid',
        'tenant_id',
        'content_type_id',
        'author_id',
        'title',
        'slug',
        'excerpt',
        'content',
        'content_format',
        'featured_image_id',
        'status',
        'published_at',
        'scheduled_publish_at',
        'custom_url',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'canonical_url',
        'view_count',
        'comment_count',
        'is_featured',
        'is_pinned',
        'is_commentable',
        'sort_order',
        'metadata',
    ];

    protected $casts = [
        'content' => 'array',
        'seo_keywords' => 'array',
        'metadata' => 'array',
        'view_count' => 'integer',
        'comment_count' => 'integer',
        'is_featured' => 'boolean',
        'is_pinned' => 'boolean',
        'is_commentable' => 'boolean',
        'sort_order' => 'integer',
        'published_at' => 'datetime',
        'scheduled_publish_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
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
            
            if (empty($model->slug) && !empty($model->title)) {
                $model->slug = Str::slug($model->title);
            }
        });
    }

    public function contentType(): BelongsTo
    {
        return $this->belongsTo(ContentTypeEloquentModel::class, 'content_type_id', 'uuid');
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\UserEloquentModel::class, 'author_id', 'uuid');
    }

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(\App\Infrastructure\Persistence\Eloquent\TenantEloquentModel::class, 'tenant_id', 'uuid');
    }

    public function categories(): BelongsToMany
    {
        return $this->belongsToMany(
            ContentCategoryEloquentModel::class,
            'canplug_pagen_category_pivot',
            'content_id',
            'category_id',
            'uuid',
            'uuid'
        )->withTimestamps();
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ContentCommentEloquentModel::class, 'content_id', 'uuid');
    }

    public function approvedComments(): HasMany
    {
        return $this->comments()->where('status', 'approved');
    }

    public function revisions(): HasMany
    {
        return $this->hasMany(ContentRevisionEloquentModel::class, 'content_id', 'uuid')
            ->orderBy('created_at', 'desc');
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(
            ContentTagEloquentModel::class,
            'canplug_pagen_tag_pivot',
            'content_id',
            'tag_id',
            'uuid',
            'uuid'
        )->withTimestamps();
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published')
            ->where('published_at', '<=', now());
    }

    public function scopeDraft($query)
    {
        return $query->where('status', 'draft');
    }

    public function scopeScheduled($query)
    {
        return $query->where('status', 'scheduled')
            ->where('scheduled_publish_at', '>', now());
    }

    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeForTenant($query, string $tenantId)
    {
        return $query->where('tenant_id', $tenantId);
    }

    public function scopeOfType($query, string $contentTypeUuid)
    {
        return $query->where('content_type_id', $contentTypeUuid);
    }
}
