<?php

namespace App\Domain\Content\Entities;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

/**
 * Platform Page Version Entity
 * 
 * Version history for platform pages to enable rollback and change tracking.
 */
class PlatformPageVersion extends Model
{
    use HasFactory;

    protected $table = 'platform_page_versions';

    protected $fillable = [
        'page_id',
        'version_number',
        'content',
        'meta_data',
        'change_description',
        'created_by',
        'is_current'
    ];

    protected $casts = [
        'content' => 'array',
        'meta_data' => 'array',
        'is_current' => 'boolean',
    ];

    /**
     * Relationships
     */
    public function page(): BelongsTo
    {
        return $this->belongsTo(PlatformPage::class, 'page_id');
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scopes
     */
    public function scopeCurrent($query)
    {
        return $query->where('is_current', true);
    }

    public function scopeByPage($query, int $pageId)
    {
        return $query->where('page_id', $pageId);
    }

    /**
     * Business Methods
     */
    public function restore(): bool
    {
        // Mark other versions as not current
        static::where('page_id', $this->page_id)->update(['is_current' => false]);

        // Mark this version as current
        $this->update(['is_current' => true]);

        // Update page content with this version's content
        $this->page->update([
            'content' => $this->content,
            'meta_data' => $this->meta_data
        ]);

        return true;
    }

    public function isCurrent(): bool
    {
        return $this->is_current;
    }
}