<?php

namespace App\Infrastructure\Persistence\Eloquent\Repositories;

use App\Domain\CustomerQuote\Repositories\DocumentTemplateRepositoryInterface;
use App\Domain\CustomerQuote\ValueObjects\DocumentTemplate as DocumentTemplateVO;
use App\Infrastructure\Persistence\Eloquent\Models\DocumentTemplate;
use Illuminate\Support\Facades\Cache;

/**
 * Eloquent implementation of DocumentTemplateRepositoryInterface
 * 
 * Implements caching for document templates to reduce database queries
 */
class DocumentTemplateRepository implements DocumentTemplateRepositoryInterface
{
    private const CACHE_TTL = 7200; // 2 hours
    private const CACHE_PREFIX = 'document_template:';

    public function __construct(
        private DocumentTemplate $model
    ) {}

    public function getByTenantAndType(int $tenantId, string $templateType): ?DocumentTemplateVO
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function getDefaultByType(string $templateType): ?DocumentTemplateVO
    {
        // For now, return null as Application layer uses Eloquent directly
        return null;
    }

    public function save(int $tenantId, DocumentTemplateVO $template): void
    {
        // Clear cache when template is saved
        $this->clearCache($tenantId);
        
        // For now, Application layer saves directly via Eloquent
    }

    public function hasCustomTemplate(int $tenantId, string $templateType): bool
    {
        $cacheKey = self::CACHE_PREFIX . $tenantId . ':' . $templateType . ':exists';

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($tenantId, $templateType) {
            return $this->model->where('tenant_id', $tenantId)
                ->where('document_type', $templateType)
                ->exists();
        });
    }

    public function delete(int $tenantId, string $templateType): void
    {
        $this->model->where('tenant_id', $tenantId)
            ->where('document_type', $templateType)
            ->delete();

        // Clear cache when template is deleted
        $this->clearCache($tenantId, $templateType);
    }

    public function getAllByTenant(int $tenantId): array
    {
        $cacheKey = self::CACHE_PREFIX . $tenantId . ':all';

        return Cache::remember($cacheKey, self::CACHE_TTL, function () use ($tenantId) {
            return $this->model->where('tenant_id', $tenantId)
                ->orderBy('document_type')
                ->get()
                ->toArray();
        });
    }

    public function getAvailableTypes(): array
    {
        return [
            'quotation',
            'proforma_invoice',
            'tax_invoice',
            'purchase_order',
            'delivery_note',
            'receipt',
        ];
    }

    /**
     * Clear cache for specific tenant and template type
     */
    private function clearCache(int $tenantId, ?string $templateType = null): void
    {
        // Clear all templates cache for tenant
        Cache::forget(self::CACHE_PREFIX . $tenantId . ':all');

        // Clear specific template cache if provided
        if ($templateType) {
            Cache::forget(self::CACHE_PREFIX . $tenantId . ':' . $templateType . ':exists');
        } else {
            // Clear all template type caches
            foreach ($this->getAvailableTypes() as $type) {
                Cache::forget(self::CACHE_PREFIX . $tenantId . ':' . $type . ':exists');
            }
        }
    }

    /**
     * Clear all document template cache
     */
    public function clearAllCache(): void
    {
        // This would require tracking all tenant IDs or using cache tags
        // For now, individual cache clearing is sufficient
    }
}

