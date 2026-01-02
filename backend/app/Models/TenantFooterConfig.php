<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use Spatie\Multitenancy\Models\Tenant;

class TenantFooterConfig extends Model implements TenantAwareModel
{
    use HasFactory, SoftDeletes, BelongsToTenant;

    protected $table = 'tenant_footer_configs';

    protected $fillable = [
        'tenant_id',
        'uuid',
        'footer_sections',
        'contact_address',
        'contact_phone',
        'contact_email',
        'contact_working_hours',
        'social_links',
        'show_newsletter',
        'newsletter_title',
        'newsletter_subtitle',
        'newsletter_button_text',
        'newsletter_api_endpoint',
        'about_text',
        'copyright_text',
        'bottom_text',
        'show_social_links',
        'show_contact_info',
        'show_sections',
        'footer_style',
        'background_color',
        'text_color',
        'legal_links',
        'is_active',
        'notes',
        'version',
        'last_modified_by',
    ];

    protected $casts = [
        'footer_sections' => 'array',
        'social_links' => 'array',
        'legal_links' => 'array',
        'show_newsletter' => 'boolean',
        'show_social_links' => 'boolean',
        'show_contact_info' => 'boolean',
        'show_sections' => 'boolean',
        'is_active' => 'boolean',
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
