<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;

class ProductCategory extends Model
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'product_categories';

    protected $fillable = [
        'uuid',
        'tenant_id',
        'name',
        'slug',
        'description',
        'parent_id',
        'sort_order',
        'level',
        'path',
        'image',
        'icon',
        'color_scheme',
        'is_active',
        'is_featured',
        'show_in_menu',
        'allowed_materials',
        'quality_levels',
        'customization_options',
        'seo_title',
        'seo_description',
        'seo_keywords',
        'base_markup_percentage',
        'requires_quote',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'is_featured' => 'boolean',
        'show_in_menu' => 'boolean',
        'allowed_materials' => 'array',
        'quality_levels' => 'array',
        'customization_options' => 'array',
        'seo_keywords' => 'array',
        'base_markup_percentage' => 'decimal:2',
        'requires_quote' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $dates = [
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    protected $attributes = [
        'is_active' => true,
        'is_featured' => false,
        'show_in_menu' => true,
        'requires_quote' => false,
        'level' => 0,
        'sort_order' => 0,
    ];

    /**
     * Get the tenant that owns this category
     */
    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Get the parent category
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'parent_id');
    }

    /**
     * Get the child categories
     */
    public function children(): HasMany
    {
        return $this->hasMany(ProductCategory::class, 'parent_id');
    }

    /**
     * Get all descendant categories (recursive)
     */
    public function descendants()
    {
        return $this->children()->with('descendants');
    }

    /**
     * Get products in this category
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'category_id');
    }

    /**
     * Scope to get only active categories
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Scope to get only featured categories
     */
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    /**
     * Scope to get only root categories (level 0)
     */
    public function scopeRoot($query)
    {
        return $query->where('level', 0);
    }

    /**
     * Scope to get categories by level
     */
    public function scopeByLevel($query, $level)
    {
        return $query->where('level', $level);
    }

    /**
     * Scope to get categories that show in menu
     */
    public function scopeShowInMenu($query)
    {
        return $query->where('show_in_menu', true);
    }

    /**
     * Scope to order by sort order
     */
    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('name');
    }

    /**
     * Check if category has children
     */
    public function hasChildren(): bool
    {
        return $this->children()->count() > 0;
    }

    /**
     * Check if category has products
     */
    public function hasProducts(): bool
    {
        return $this->products()->count() > 0;
    }

    /**
     * Get the full category path as string
     */
    public function getFullPath(): string
    {
        $path = collect();
        $category = $this;
        
        while ($category) {
            $path->prepend($category->name);
            $category = $category->parent;
        }
        
        return $path->implode(' / ');
    }

    /**
     * Get breadcrumb array
     */
    public function getBreadcrumb(): array
    {
        $breadcrumb = [];
        $category = $this;
        
        while ($category) {
            $breadcrumb[] = [
                'id' => $category->id,
                'uuid' => $category->uuid,
                'name' => $category->name,
                'slug' => $category->slug,
            ];
            $category = $category->parent;
        }
        
        return array_reverse($breadcrumb);
    }

    /**
     * Boot method to handle model events
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-generate UUID when creating
        static::creating(function ($model) {
            if (empty($model->uuid)) {
                $model->uuid = \Ramsey\Uuid\Uuid::uuid4()->toString();
            }
        });

        // Update hierarchy when parent changes
        static::saving(function ($model) {
            if ($model->isDirty('parent_id')) {
                $model->updateHierarchy();
            }
        });
    }

    /**
     * Update hierarchy info (level, path) based on parent
     */
    protected function updateHierarchy()
    {
        if ($this->parent_id) {
            $parent = static::find($this->parent_id);
            if ($parent) {
                $this->level = $parent->level + 1;
                $this->path = $parent->path . '/' . $this->slug;
            }
        } else {
            $this->level = 0;
            $this->path = $this->slug;
        }
    }
}