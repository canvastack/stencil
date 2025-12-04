<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformPage extends Model
{
    use HasFactory;

    protected $table = 'platform_pages';

    protected $fillable = [
        'page_slug',
        'content',
        'status',
        'published_at',
        'version',
        'previous_version',
        'updated_by',
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