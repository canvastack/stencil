<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use Spatie\Multitenancy\Models\Tenant;

class TenantMenu extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'tenant_menus';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'parent_id',
        'label',
        'path',
        'icon',
        'description',
        'target',
        'is_external',
        'requires_auth',
        'is_active',
        'is_visible',
        'show_in_header',
        'show_in_footer',
        'show_in_mobile',
        'sort_order',
        'custom_class',
        'badge_text',
        'badge_color',
        'allowed_roles',
        'notes',
        'click_count',
    ];

    protected $casts = [
        'is_external' => 'boolean',
        'requires_auth' => 'boolean',
        'is_active' => 'boolean',
        'is_visible' => 'boolean',
        'show_in_header' => 'boolean',
        'show_in_footer' => 'boolean',
        'show_in_mobile' => 'boolean',
        'sort_order' => 'integer',
        'click_count' => 'integer',
        'allowed_roles' => 'array',
    ];

    protected $hidden = [
        'id',
        'tenant_id',
    ];

    protected $appends = [
        'has_children',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'uuid');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(TenantMenu::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(TenantMenu::class, 'parent_id')
            ->orderBy('sort_order');
    }

    public function getHasChildrenAttribute(): bool
    {
        return $this->children()->count() > 0;
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeVisible($query)
    {
        return $query->where('is_visible', true);
    }

    public function scopeTopLevel($query)
    {
        return $query->whereNull('parent_id');
    }

    public function scopeInHeader($query)
    {
        return $query->where('show_in_header', true);
    }

    public function scopeInFooter($query)
    {
        return $query->where('show_in_footer', true);
    }

    public function scopeInMobile($query)
    {
        return $query->where('show_in_mobile', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('label');
    }

    public function scopeForLocation($query, string $location)
    {
        return match ($location) {
            'header' => $query->inHeader(),
            'footer' => $query->inFooter(),
            'mobile' => $query->inMobile(),
            default => $query,
        };
    }

    public function incrementClickCount(): void
    {
        $this->increment('click_count');
    }

    public static function buildHierarchy($menus)
    {
        $menusArray = [];
        foreach ($menus as $menu) {
            $item = $menu->toArray();
            $item['children_items'] = [];
            $menusArray[$menu->id] = $item;
        }

        $hierarchy = [];

        foreach ($menusArray as $id => $item) {
            if ($item['parent_id'] === null) {
                $hierarchy[$id] = &$menusArray[$id];
            } else {
                if (isset($menusArray[$item['parent_id']])) {
                    $menusArray[$item['parent_id']]['children_items'][] = &$menusArray[$id];
                }
            }
        }

        return array_values($hierarchy);
    }
}
