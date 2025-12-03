<?php

namespace App\Domain\Content\Entities;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Platform Content Block Entity
 * 
 * Reusable content templates that can be used by platform administrators
 * and made available to tenants as starting templates.
 */
class PlatformContentBlock extends Model
{
    use HasFactory;

    protected $table = 'platform_content_blocks';

    protected $fillable = [
        'name',
        'identifier',
        'description',
        'schema',
        'default_content',
        'category',
        'is_reusable',
        'is_active',
        'is_template'
    ];

    protected $casts = [
        'schema' => 'array',
        'default_content' => 'array',
        'is_reusable' => 'boolean',
        'is_active' => 'boolean',
        'is_template' => 'boolean',
    ];

    /**
     * Scopes
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeTemplates($query)
    {
        return $query->where('is_template', true);
    }

    public function scopeReusable($query)
    {
        return $query->where('is_reusable', true);
    }

    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Business Methods
     */
    public function validateContent(array $content): bool
    {
        // Basic schema validation - in production, use a proper JSON schema validator
        if (empty($this->schema)) {
            return true; // No schema defined, accept any content
        }

        // Check required fields
        if (isset($this->schema['required'])) {
            foreach ($this->schema['required'] as $field) {
                if (!array_key_exists($field, $content)) {
                    return false;
                }
            }
        }

        return true;
    }

    public function makeAvailableToTenants(): bool
    {
        return $this->update(['is_template' => true]);
    }

    public function removeFromTenants(): bool
    {
        return $this->update(['is_template' => false]);
    }

    public function activate(): bool
    {
        return $this->update(['is_active' => true]);
    }

    public function deactivate(): bool
    {
        return $this->update(['is_active' => false]);
    }

    public function isAvailableToTenants(): bool
    {
        return $this->is_template && $this->is_active;
    }

    public function getRouteKeyName(): string
    {
        return 'identifier';
    }
}