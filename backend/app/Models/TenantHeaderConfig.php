<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use Spatie\Multitenancy\Models\Tenant;

class TenantHeaderConfig extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'tenant_header_configs';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'brand_name',
        'brand_initials',
        'brand_tagline',
        'logo_url',
        'logo_dark_url',
        'logo_width',
        'logo_height',
        'logo_alt_text',
        'use_logo',
        'header_style',
        'show_cart',
        'show_search',
        'show_login',
        'sticky_header',
        'transparent_on_scroll',
        'styling_options',
        'login_button_text',
        'cart_button_text',
        'search_placeholder',
        'is_active',
        'notes',
        'version',
        'last_modified_by',
    ];

    protected $casts = [
        'use_logo' => 'boolean',
        'show_cart' => 'boolean',
        'show_search' => 'boolean',
        'show_login' => 'boolean',
        'sticky_header' => 'boolean',
        'transparent_on_scroll' => 'boolean',
        'is_active' => 'boolean',
        'styling_options' => 'array',
        'logo_width' => 'integer',
        'logo_height' => 'integer',
        'version' => 'integer',
    ];

    protected $hidden = [
        'id',
        'tenant_id',
    ];

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'uuid');
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForTenantUuid($query, string $tenantUuid)
    {
        return $query->whereHas('tenant', function ($q) use ($tenantUuid) {
            $q->where('uuid', $tenantUuid);
        });
    }
}
