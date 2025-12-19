<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;

class Setting extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $fillable = [
        'uuid',
        'tenant_id',
        'key',
        'category',
        'value',
        'type',
        'default_value',
        'label',
        'description',
        'is_public',
        'is_editable',
        'validation_rules',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_editable' => 'boolean',
        'validation_rules' => 'array',
    ];

    /**
     * Get the casted value based on type
     */
    public function getCastedValue()
    {
        return match ($this->type) {
            'integer' => (int) $this->value,
            'float', 'decimal' => (float) $this->value,
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'json' => json_decode($this->value, true),
            'array' => json_decode($this->value, true) ?? [],
            default => $this->value,
        };
    }

    /**
     * Set value with automatic type conversion
     */
    public function setCastedValue($value): void
    {
        $this->value = match ($this->type) {
            'json', 'array' => json_encode($value),
            'boolean' => $value ? '1' : '0',
            default => (string) $value,
        };
    }

    /**
     * Scope by category
     */
    public function scopeByCategory($query, string $category)
    {
        return $query->where('category', $category);
    }

    /**
     * Scope by key prefix
     */
    public function scopeByKeyPrefix($query, string $prefix)
    {
        return $query->where('key', 'like', $prefix . '%');
    }

    /**
     * Scope public settings only
     */
    public function scopePublic($query)
    {
        return $query->where('is_public', true);
    }

    /**
     * Scope editable settings only
     */
    public function scopeEditable($query)
    {
        return $query->where('is_editable', true);
    }
}
