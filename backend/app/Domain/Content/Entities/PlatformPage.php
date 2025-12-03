<?php

namespace App\Domain\Content\Entities;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use App\Models\User;

/**
 * Platform Page Entity
 * 
 * Global content pages managed by Platform Administrators.
 * Stored in main database and available as templates for tenants.
 */
class PlatformPage extends Model
{
    use HasFactory;

    protected $table = 'platform_pages';

    protected $fillable = [
        'uuid',
        'title',
        'slug',
        'description', 
        'content',
        'template',
        'meta_data',
        'status',
        'is_homepage',
        'sort_order',
        'language',
        'parent_id',
        'published_at',
        'created_by'
    ];

    protected $casts = [
        'content' => 'array',
        'meta_data' => 'array',
        'is_homepage' => 'boolean',
        'published_at' => 'datetime',
    ];

    protected $dates = [
        'published_at',
        'created_at',
        'updated_at'
    ];

    /**
     * Relationships
     */
    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(PlatformPage::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(PlatformPage::class, 'parent_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PlatformPageVersion::class, 'page_id');
    }

    public function currentVersion(): HasOne
    {
        return $this->hasOne(PlatformPageVersion::class, 'page_id')->where('is_current', true);
    }

    /**
     * Scopes
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeHomepage($query)
    {
        return $query->where('is_homepage', true);
    }

    public function scopeByLanguage($query, string $language)
    {
        return $query->where('language', $language);
    }

    /**
     * Model Events
     */
    protected static function booted()
    {
        static::creating(function ($page) {
            if (!$page->uuid) {
                $page->uuid = (string) Str::uuid();
            }
            
            if (!$page->slug) {
                $page->slug = Str::slug($page->title);
            }
        });

        static::created(function ($page) {
            // Create initial version
            $page->versions()->create([
                'version_number' => 1,
                'content' => $page->content,
                'meta_data' => $page->meta_data,
                'change_description' => 'Initial version',
                'created_by' => $page->created_by,
                'is_current' => true,
            ]);
        });

        static::updated(function ($page) {
            // Create new version if content changed
            if ($page->isDirty('content') || $page->isDirty('meta_data')) {
                $page->createVersion('Content updated');
            }
        });
    }

    /**
     * Business Methods
     */
    public function createVersion(string $changeDescription = null): PlatformPageVersion
    {
        $latestVersion = $this->versions()->latest('version_number')->first();
        $newVersionNumber = $latestVersion ? $latestVersion->version_number + 1 : 1;

        // Mark previous versions as not current
        $this->versions()->update(['is_current' => false]);

        return $this->versions()->create([
            'version_number' => $newVersionNumber,
            'content' => $this->content,
            'meta_data' => $this->meta_data,
            'change_description' => $changeDescription,
            'created_by' => auth()->id(),
            'is_current' => true,
        ]);
    }

    public function publish(): bool
    {
        $this->update([
            'status' => 'published',
            'published_at' => now()
        ]);

        return true;
    }

    public function unpublish(): bool
    {
        $this->update([
            'status' => 'draft',
            'published_at' => null
        ]);

        return true;
    }

    public function archive(): bool
    {
        $this->update(['status' => 'archived']);
        return true;
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

    public function setAsHomepage(): bool
    {
        // Remove homepage flag from other pages with same language
        static::where('language', $this->language)
              ->where('id', '!=', $this->id)
              ->update(['is_homepage' => false]);

        $this->update(['is_homepage' => true]);
        return true;
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }
}