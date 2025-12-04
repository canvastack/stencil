<?php

declare(strict_types=1);

namespace App\Domain\Content\Entities;

use App\Domain\Shared\ValueObjects\Uuid;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Stancl\Tenancy\Database\Concerns\BelongsToTenant;

/**
 * Tenant Page Entity for tenant database schemas  
 * Manages tenant-specific business content with proper isolation
 */
class TenantPage extends Model
{
    use HasFactory, BelongsToTenant;

    protected $table = 'tenant_pages';

    protected $fillable = [
        'uuid',
        'title',
        'slug', 
        'description',
        'content',
        'template',
        'meta_data',
        'status',
        'page_type',
        'is_homepage',
        'sort_order',
        'language',
        'published_at',
        'tenant_id'
    ];

    protected $casts = [
        'content' => 'array',
        'meta_data' => 'array',
        'is_homepage' => 'boolean',
        'published_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    protected $attributes = [
        'status' => 'draft',
        'page_type' => 'home',
        'is_homepage' => false,
        'sort_order' => 0,
        'language' => 'en'
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = Uuid::generate();
            }
        });
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('page_type', $type);
    }

    public function scopeByLanguage($query, string $language = 'en')
    {
        return $query->where('language', $language);
    }

    public function scopeHomepage($query)
    {
        return $query->where('is_homepage', true);
    }

    public function isPublished(): bool
    {
        return $this->status === 'published';
    }

    public function isDraft(): bool
    {
        return $this->status === 'draft';
    }

    public function isArchived(): bool
    {
        return $this->status === 'archived';
    }

    public function publish(): void
    {
        $this->status = 'published';
        $this->published_at = now();
        $this->save();
    }

    public function archive(): void
    {
        $this->status = 'archived';
        $this->save();
    }

    public function getRouteKeyName(): string
    {
        return 'slug';
    }

    public function getContentSectionAttribute(): ?array
    {
        return $this->content;
    }

    public function updateContent(array $content): void
    {
        $this->content = array_merge($this->content ?? [], $content);
        $this->save();
    }
}