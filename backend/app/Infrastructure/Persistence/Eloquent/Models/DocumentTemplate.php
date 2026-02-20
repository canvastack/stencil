<?php

namespace App\Infrastructure\Persistence\Eloquent\Models;

use App\Infrastructure\Persistence\Eloquent\Contracts\TenantAwareModel;
use App\Infrastructure\Persistence\Eloquent\Traits\BelongsToTenant;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DocumentTemplate extends Model implements TenantAwareModel
{
    use HasFactory, BelongsToTenant;

    protected $table = 'document_templates';

    protected $fillable = [
        'tenant_id',
        'document_type',
        'name',
        'description',
        'template_content',
        'template_variables',
        'header_content',
        'footer_content',
        'styles',
        'page_size',
        'page_orientation',
        'margins',
        'language',
        'is_default',
        'is_active',
        'metadata',
    ];

    protected $casts = [
        'template_variables' => 'json',
        'margins' => 'json',
        'metadata' => 'json',
        'is_default' => 'boolean',
        'is_active' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationships
     */

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Scopes
     */

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeDefault($query)
    {
        return $query->where('is_default', true);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('document_type', $type);
    }

    /**
     * Attributes/Accessors
     */

    /**
     * Get template variables as array
     */
    public function getVariablesAttribute(): array
    {
        return $this->template_variables ?? [];
    }

    /**
     * Get margins as array with defaults
     */
    public function getMarginsAttribute($value): array
    {
        $margins = json_decode($value, true) ?? [];
        
        return array_merge([
            'top' => 20,
            'right' => 20,
            'bottom' => 20,
            'left' => 20,
        ], $margins);
    }

    /**
     * Get default template for a document type
     */
    public static function getDefaultForType(int $tenantId, string $documentType): ?self
    {
        return static::where('tenant_id', $tenantId)
            ->where('document_type', $documentType)
            ->where('is_default', true)
            ->where('is_active', true)
            ->first();
    }

    /**
     * Get all available variables for a document type
     */
    public static function getAvailableVariables(string $documentType): array
    {
        $commonVariables = [
            'company_name',
            'company_address',
            'company_phone',
            'company_email',
            'company_logo',
            'document_number',
            'document_date',
            'customer_name',
            'customer_email',
            'customer_phone',
            'customer_address',
        ];

        $typeSpecificVariables = [
            'quotation' => [
                'quote_number',
                'valid_until',
                'items',
                'subtotal',
                'tax',
                'grand_total',
                'payment_terms',
                'delivery_timeline',
                'terms_and_conditions',
            ],
            'proforma_invoice' => [
                'invoice_number',
                'due_date',
                'items',
                'subtotal',
                'tax',
                'grand_total',
                'payment_instructions',
            ],
            'tax_invoice' => [
                'invoice_number',
                'tax_id',
                'items',
                'subtotal',
                'tax',
                'grand_total',
                'payment_status',
            ],
            'purchase_order' => [
                'po_number',
                'vendor_name',
                'vendor_address',
                'items',
                'total_amount',
                'delivery_date',
                'payment_terms',
            ],
            'delivery_note' => [
                'delivery_note_number',
                'delivery_date',
                'items',
                'recipient_name',
                'recipient_signature',
            ],
            'receipt' => [
                'receipt_number',
                'payment_date',
                'payment_method',
                'amount_paid',
                'payment_for',
            ],
        ];

        return array_merge(
            $commonVariables,
            $typeSpecificVariables[$documentType] ?? []
        );
    }
}
