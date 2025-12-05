<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

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
        'page_type',
        'is_homepage',
        'sort_order',
        'language',
        'published_at',
    ];

    protected $casts = [
        'content' => 'array',
        'published_at' => 'datetime',
    ];

    /**
     * Scope for published pages
     */
    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    /**
     * Get page by slug
     */
    public static function getBySlug(string $slug)
    {
        return static::where('page_slug', $slug)
            ->published()
            ->first();
    }
}