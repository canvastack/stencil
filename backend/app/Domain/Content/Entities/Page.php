<?php

namespace App\Domain\Content\Entities;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;
use App\Models\User;
use Spatie\Multitenancy\Models\Concerns\UsesTenantConnection;

/**
 * Tenant Page Entity
 * 
 * Tenant-specific content pages stored in schema-per-tenant.
 * Can reference platform templates for inheritance.
 */
class Page extends Model
{
    use HasFactory, UsesTenantConnection;

    protected $table = 'pages';

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
        'platform_template_id',
        'published_at'
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
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id');
    }

    public function versions(): HasMany
    {
        return $this->hasMany(PageVersion::class, 'page_id');
    }

    public function currentVersion(): HasOne
    {
        return $this->hasOne(PageVersion::class, 'page_id')->where('is_current', true);
    }

    /**
     * Platform template relationship (handled manually due to cross-schema reference)
     */
    public function getPlatformTemplateAttribute()
    {
        if (!$this->platform_template_id) {
            return null;
        }

        // Switch to main connection to get platform template
        return PlatformContentBlock::on('landlord')->find($this->platform_template_id);
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

    public function scopeFromPlatformTemplate($query, int $templateId)
    {
        return $query->where('platform_template_id', $templateId);
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
                'created_by' => auth()->id(),
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
    public function createVersion(string $changeDescription = null): PageVersion
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

    public function createFromPlatformTemplate(int $templateId, array $customizations = []): static
    {
        $template = PlatformContentBlock::on('landlord')->find($templateId);
        
        if (!$template) {
            throw new \InvalidArgumentException("Platform template not found: {$templateId}");
        }

        // Merge template content with customizations
        $content = array_merge($template->default_content ?? [], $customizations);

        $this->fill([
            'platform_template_id' => $templateId,
            'content' => $content,
            'template' => $template->identifier,
        ]);

        return $this;
    }

    public function adoptPlatformTemplateUpdates(): bool
    {
        if (!$this->platform_template_id) {
            return false;
        }

        $template = PlatformContentBlock::on('landlord')->find($this->platform_template_id);
        
        if (!$template) {
            return false;
        }

        // Merge current customizations with updated template
        $updatedContent = array_merge($template->default_content ?? [], $this->content);

        $this->update(['content' => $updatedContent]);

        $this->createVersion("Adopted platform template updates from template ID {$this->platform_template_id}");

        return true;
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